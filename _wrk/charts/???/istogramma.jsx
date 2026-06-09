
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useState, useEffect, useRef, Fragment, useMemo, useLayoutEffect, StrictMode } from 'react';

import getConfig, {setChartArea, valueToYCoord} from './base-cfg';
import InfoBox from './InfoBox';
// import Legenda from '../components/legenda';
import { formatDelta } from '@appsDashboard/componenti-condivisi/utilities';

// TODO[epic=dashboard] valori negativi

function Istogramma(props) {

  const svgRef = useRef(),
    [svgWidth, setSvgWidth] = useState(null),
    [svgHeight, setSvgHeight] = useState(null),
    [infoBoxData, setInfoBoxData] = useState(null),
    [hoverGrid, setHoverGrid] = useState(null),
    [content, setContent] = useState(null);

  const cfg = useMemo(() => {
    return getConfig();
  }, []);


  // =>> resize observer, definizione `svgWidth` e `svgHeight`
  useLayoutEffect(() => {
    // https://stackoverflow.com/questions/58222004/how-to-get-parent-width-height-in-react-using-hooks

    setSvgWidth(svgRef.current?.getBoundingClientRect().width);
    setSvgHeight(svgRef.current?.getBoundingClientRect().height);

    const resizeObserver = new ResizeObserver( entries => {

      // setSvgWidth(entries[0].target?.getBoundingClientRect().width);
      // setSvgHeight(entries[0].target?.getBoundingClientRect().height);
      setSvgWidth(entries[0].contentRect.width);
      setSvgHeight(entries[0].contentRect.height);
    });

    // il resizeObserver è applicato al div genitore e non direttamente all'svg
    // perché possa esser rilevato ad ogni modifica
    if(svgRef.current) {
      resizeObserver.observe(svgRef.current.closest('div'));
    }
  }, [svgRef]);

  useEffect(() => {

    // ordinamento per xKey
    const chart_data = props.dati.slice(0);
    chart_data.sort((a,b) => +a[props.xKey] - b[props.xKey]);

    // valore massimo dei dati
    cfg.max_value= chart_data.reduce((prev, curr) => {
      return Math.max(prev, ...Object.values(curr));
    }, 0);

    // valore di ogni step asse y
    // (usato per il calcolo delle etichette dell'asse Y)
    cfg.asseY_step_val = Math.ceil((cfg.max_value / cfg.asseY_steps) / 1000) * 1000;

    // Ricalcolo max_value in modo che sia un multiplo esatto di asseY_step_val
    cfg.max_value = cfg.asseY_step_val * cfg.asseY_steps;
    // console.log(cfg);

    // correzione eti_asseX_height
    cfg.eti_asseX_height = 10;

    if(svgWidth && svgHeight) {

      // =>> chart area
      // coordinate del rettangolo interno all'svg entro cui viene disegnato il grafico
      // i lati sx e inferiore corrispondono agli assi
      // la variabile cfg.chart_area contiene le distanze dal bordo dei 4 lati del rettangolo
      // e le dimensioni dei lati
      cfg.chart_area = setChartArea(cfg, svgWidth, svgHeight);

      // console.log(cfg.chart_area);

      // larghezza ogni step dell'asse X
      cfg.xStep = cfg.chart_area.width / Object.keys(props.xLabels).length;

      // coordinata x corrisponde al valore di xKey
      const xKeyToX = key => Math.round(cfg.chart_area.left + ((Number(key) - 1) * cfg.xStep)) * 1e4 / 1e4;

      // console.log(cfg.chart_area.left);
      // console.log(((Number(1) - 1) * cfg.xStep));
      // console.log(xKeyToX(1));

      // array dei gruppi di barre
      let barGroups= [];

      // array degli elementi Rect da associare agli eventi hover
      let hoverGridArray = [];

      // larghezza di ogni barra
      const bar_width = Math.round((
        (cfg.xStep -
          (cfg.bar_margin * 2) -
          (cfg.bar_gap * (props.keys.length - 1))
        ) / props.keys.length) * 1e4) / 1e4;

      // coordinata y della base del grafico (valore = 0)
      const value0y = cfg.chart_area.top + cfg.chart_area.height;

      // =>> costruzione barre
      chart_data.forEach((this_data, idx) => {

        const start_x = xKeyToX(this_data[props.xKey]);

        // =>> barGroups (punti e griglia x)
        barGroups.push(
          <g
            key={idx}
            data-x-key={this_data[props.xKey]}
            className={props.styles.dataGroup}
          >
            {/* sfondo sezione */}
            <rect
              x={start_x}
              y={cfg.chart_area.top}
              width={cfg.xStep}
              height={cfg.chart_area.height}
              className={classnames({[props.styles.xEvenAreas]: idx % 2, [props.styles.xOddAreas]: idx % 2 === 0})}
            />

            {props.keys.map((k, idx) => {
              // x del lato sinistro della barra
              const x = start_x + cfg.bar_margin + ((bar_width + cfg.bar_gap) * idx);

              if(this_data[k.key] > 0 ) {
                const y = valueToYCoord(this_data[k.key], cfg);

                // valore y esclusa la parte arrotondata
                let verticalY = y + bar_width/2;

                // calcolo coord: https://codepen.io/massimo-cassandro/pen/poZONxM
                // https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d#cubic_b%C3%A9zier_curve
                // NB tracciato non chiuso (senza `z` finale)
                // i parametri delle curve di bezier devono essere sempre inferiori
                // alla coordinata y del valore 0


                /*if(this_data[props.xKey] === 12) {
                  console.log(k.key,
                    'y', y,
                    bar_width, bar_width/2,
                    value0y, value0y + bar_width/2);
                }*/

                let d;

                if(verticalY > value0y) {

                  // conversione in curve quadratiche
                  // https://yqnn.github.io/svg-path-editor/#P=M_35_100_q_0_-8_15_-8_q_15_0_15_8_z
                  // https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d#quadratic_b%C3%A9zier_curve

                  let dy = Math.abs(y - value0y);

                  d= `M ${x},${value0y}
                    q 0 -${dy} ${bar_width/2} -${dy}
                    q ${bar_width/2} 0 ${bar_width/2} ${dy}`;

                }  else {
                  d = `M ${x},${value0y}
                    V ${verticalY}
                    c 0 -${bar_width/4}, ${bar_width/4} -${bar_width/2}, ${bar_width/2} -${bar_width/2}
                    c ${bar_width/4} 0, ${bar_width/2} ${bar_width/4}, ${bar_width/2} ${bar_width/2}
                    V ${value0y}`;
                }
                /*d={`M ${x},${value0y}
                  V ${verticalY}
                  c 0 -${bar_width/4}, ${bar_width/4} -${bar_width/2}, ${bar_width/2} -${bar_width/2}
                  c ${bar_width/4} 0, ${bar_width/2} ${bar_width/4}, ${bar_width/2} ${bar_width/2}
                  V ${value0y}`.replace(/\s+/g, ' ')} */
                return <path
                  key={idx}
                  d={d.replace(/\s+/g, ' ')}
                  className={classnames(k.barClassNames)}
                />;


              } else {
                return  null;
              }

            })}

            {/* griglia x */}
            {/* <line
              className={props.styles.gridLines}
              x1={x}
              y1={cfg.chart_area.top}
              x2={x}
              y2={cfg.chart_area.bottom}
            /> */}

          </g>
        ); // end barGroups.push

        // =>> hoverGridArray (costruzione)
        // =>> listener Show/Hide InfoBox
        hoverGridArray.push(
          <rect
            key={this_data[props.xKey]}
            data-x-key={this_data[props.xKey]}
            x={start_x}
            y={cfg.chart_area.top}
            width={cfg.xStep}
            height={cfg.chart_area.height}
            fill="transparent"
            // fill={this_data[props.xKey] % 2 ? 'rgba(255 0 0 / .3)' : 'rgba(0 255 0 / .3)'}

            onMouseOver={e => {
              const xKey = +e.target.dataset.xKey
                ,itemData = chart_data.filter(this_data=> +this_data[props.xKey] === xKey)[0]
                ,dataGroupEl = svgRef.current.querySelector(`.${props.styles.dataGroup}[data-x-key='${this_data[props.xKey]}']`)
              ;
              svgRef.current.classList.add(props.styles.isHover);
              dataGroupEl?.classList.add(props.styles.dataGroupOn);
              // e.target.setAttribute('fill', 'rgba(255, 0, 0, .1)');

              setInfoBoxData({
                data: itemData,
                title: props.infoBoxLabels[xKey],
                dataGroupEl: svgRef.current.querySelector(`.${props.styles.dataGroup}[data-x-key='${this_data[props.xKey]}']`),
                extraRows: [
                  {
                    label: 'Incremento',
                    value: formatDelta(itemData.partito, itemData.partito_ap)
                  }
                ]
              });
            }}

            onMouseOut={ () => {
              // e.target.setAttribute('fill', 'transparent');
              svgRef.current.classList.remove(props.styles.isHover);
              const dataGroupEl = svgRef.current.querySelector(`.${props.styles.dataGroup}[data-x-key='${this_data[props.xKey]}']`);
              dataGroupEl?.classList.remove(props.styles.dataGroupOn);
              svgRef.current.classList.remove(props.styles.infoBoxWrapperOn);
              setInfoBoxData(null);
            }}
          />
        ); // end hoverGridArray.push */


      }); // end chart_data.forEach


      // =>> setContent
      setContent(<>

        {/* =>> asse Y */}
        <line
          data-i='aY'
          x1={cfg.chart_area.left}
          y1={cfg.chart_area.top}
          x2={cfg.chart_area.left}
          y2={cfg.chart_area.bottom}
          className={props.styles.assi}
        />
        {/* asse X */}
        <line
          data-i='aX'
          x1={cfg.chart_area.left}
          y1={cfg.chart_area.bottom}
          x2={cfg.chart_area.right}
          y2={cfg.chart_area.bottom}
          className={props.styles.assi}
        />
        {/* chiusura area grafico a dx */}
        <line
          x1={cfg.chart_area.left + cfg.chart_area.width}
          y1={cfg.chart_area.top}
          x2={cfg.chart_area.left + cfg.chart_area.width}
          y2={cfg.chart_area.bottom}
          className={props.styles.gridLines}
        />

        {/* =>> ticks, griglia e valori asse y
          il numero degli step viene incrementato di 1 per includere il valore
          iniziale (0)
        */}
        <g>
          {Object.keys(props.xLabels).map(xKey => {
            //const y = cfg.chart_area.bottom - (idx * cfg.chart_area.yStep);
            const y =  valueToYCoord((xKey-1) * cfg.asseY_step_val, cfg);
            let label = Math.ceil((cfg.asseY_step_val * (xKey-1))/1000);

            label = label.toLocaleString('it-IT', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }) + (label > 0? '\u2009K' : '');

            return <Fragment key={xKey}>
              <text
                x={cfg.chart_area.left - cfg.ticks - 2}
                y={y}
                dy='4px'
                className={props.styles.labelY}
              >{label}</text>

              {/* =>> ticks asse y */}
              <line
                className={props.styles.ticks}
                x1={cfg.chart_area.left - cfg.ticks}
                y1={y}
                x2={cfg.chart_area.left}
                y2={y}
              />

              {/* =>> griglia asse y */}
              <line
                className={props.styles.gridLines}
                x1={cfg.chart_area.left}
                y1={y}
                x2={cfg.chart_area.right}
                y2={y}
              />
            </Fragment>;
          })}
        </g>

        {/* =>> valori asse x */}
        <g>
          {Object.keys(props.xLabels).map(xKey => {
            const x = xKeyToX(xKey) + cfg.xStep/2;

            return <Fragment key={xKey}>
              <text
                x={x}
                y={cfg.chart_area.bottom + cfg.ticks + 2}
                dy={8}
                className={props.styles.labelX}
              >{props.xLabels[xKey]}</text>

              {/* =>> ticks asse x */}
              {/* <line
                className={props.styles.ticks}
                x1={x}
                y1={cfg.chart_area.bottom}
                x2={x}
                y2={cfg.chart_area.bottom + cfg.ticks}
              /> */}

            </Fragment>;
          })}
        </g>

        {/* =>> nome asse y */}
        <text
          x={cfg.padding}
          y={cfg.chart_area.top + cfg.chart_area.height/2}
          className={props.styles.axisLabel}
          transform={`rotate(270 ${cfg.padding + 2} ${cfg.chart_area.top + cfg.chart_area.height/2})`}
        >Travel Value (partito)</text>

        {/* =>> applicazione array barre */}
        {barGroups}

        {/* =>> legenda */}
        {props.legenda && <Legenda legenda={props.legenda} cfg={cfg} styles={props.styles} />}
      </>); // end setContent

      // =>> setHoverGrid
      setHoverGrid(hoverGridArray);

    } // end if(svgWidth && svgHeight)


  }, [cfg, props.dati, props.keys, props.legenda, props.xKey, props.styles, svgHeight, svgWidth, props.xLabels, props.infoBoxLabels]);

  // =>> posizionamento legenda
  useEffect(() => {
    if(content) {
      const legenda = svgRef.current.querySelector(`.${props.styles.legenda}`),
        numElementiLegenda = legenda.querySelectorAll(':scope > g').length;

      let tx = 0;
      for (let i = 1; i < numElementiLegenda; i++) {

        const prevBbox = legenda.querySelector(`.l${i-1}`)?.getBBox();
        tx += prevBbox.width + cfg.legenda.elements_gap;
        legenda.querySelector(`.l${i}`)
          .setAttribute('transform', `translate(${tx} 0)`);

      }
      legenda.setAttribute('transform', `translate(${(svgWidth-legenda.getBBox().width)/2} ${cfg.legenda.h/2})`);
    }
  }, [cfg.legenda.elements_gap, cfg.legenda.h, content, props.styles, svgWidth]);

  return (<StrictMode>
    <div>
      <svg xmlns="http://www.w3.org/2000/svg"
        ref={svgRef}
        className={classnames(props.styles.chart)}
      >
        {content}
        <InfoBox {...infoBoxData}
          styles={props.styles}
          year={props.anno?? new Date().getFullYear()}
          cfg={cfg}
          infoBoxItems={props.infoBoxItems}
          infoBoxWidth={250}
          elementsCount={Object.keys(props.xLabels).length}
          infoBoxPositionRefs={props.infoBoxPositionRefs}
        />
        <g>{hoverGrid}</g>
      </svg>
    </div>
  </StrictMode>);
}

// https://www.npmjs.com/package/prop-types

Istogramma.propTypes = {
  anno: PropTypes.number,

  dati: PropTypes.array,

  // chiavi dei dati da rappresentare, relative etichette e classe da assegnare
  // nell'ordine in cui vanno rappresentate
  // (l'ultimo elemento è in cima agli altri)
  keys: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string,
      label:PropTypes.string,
      barClassNames: PropTypes.array
    })
  ),

  styles: PropTypes.object,

  // chiave, negli oggetti dell'array dati, da utilizzare per l'asse X
  xKey: PropTypes.string,

  // oggetto con le ettichette da utilizzare per l'asse X
  // la chiave di ogni etichetta corrisponde al valore di `xKey`
  xLabels: PropTypes.object,

  // analogo a xLabels, utilizzato per i titolini di InfoBox
  infoBoxLabels: PropTypes.object,

  // legenda: Legenda.propTypes.legenda,
  // infoBoxItems: InfoBox.propTypes.infoBoxItems

};

export default Istogramma;
