// @ts-nocheck
// TODO non completato

//  rendere più generico e indipendente da fogli stili esterni

import classnames from 'classnames';
import React, { Fragment, useRef, useEffect, useState, useLayoutEffect } from 'react';
import { mesi_brevi } from '../../../shared-components/utilities';

import getConfig from './components/base-cfg';
import InfoBox from './components/InfoBox';
import Legenda from './components/Legenda';

/**
 * @typedef {{ key: string, label: string, lineClassNames?: string[], dataPointClassNames?: string[] }} LineKey
 */
/**
 * @typedef {Object} GraficoMensileProps
 * @property {number} [anno]
 * @property {Object[]} dati
 * @property {string} monthKey
 * @property {LineKey[]} [keys]
 * @property {Array} [legenda]
 * @property {Array} [infoBoxItems]
 * @property {string[]} [infoBoxPositionRefs]
 */
/** @param {GraficoMensileProps} props */
function GraficoMensile(props) {

  const svgRef= useRef(),
    [svgWidth, setSvgWidth] = useState(null),
    [svgHeight, setSvgHeight] = useState(null),
    [infoBoxData, setInfoBoxData] = useState(null),
    [hoverGrid, setHoverGrid] = useState(null),
    [content, setContent] = useState(null);

  const cfg = React.useMemo(() => {
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

    // ordinamento per mese
    const chart_data = props.dati.slice(0);
    chart_data.sort((a,b) => +a[props.monthKey] - b[props.monthKey]);

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


    if(svgWidth && svgHeight) {

      // =>> chart area
      // coordinate del rettangolo interno all'svg entro cui viene disegnato il grafico
      // i lati sx e inferiore corrispondono agli assi
      // la variabile cfg.chart_area contiene le distanze dal bordo dei 4 lati del rettangolo
      // e le dimensioni dei lati
      cfg.chart_area = {
        top       : cfg.legenda.h + cfg.padding,
        right     : svgWidth - cfg.padding,
        bottom    : svgHeight - cfg.eti_asseX_months.h - cfg.padding,
        left      : cfg.eti_asseY.w + cfg.padding,
        width     : svgWidth - (cfg.padding * 2) - cfg.eti_asseY.w,
        height    : svgHeight - (cfg.padding * 2) - cfg.legenda.h - cfg.eti_asseX_months.h
      };

      // console.log(cfg.chart_area);

      // =>> conversione valori in coordinate relative al grafico
      const valueToYCoord = (value) => {
        // la coordinata y è ricavata dalla proporzione con il valore massimo e altezza del grafico
        // => cfg.max_value : cfg.chart_area.height = value  : y
        // arrotondata a 4 cifre decimali

        return  Math.round((cfg.chart_area.top + cfg.chart_area.height - ((value * cfg.chart_area.height) / cfg.max_value)) * 1e4) / 1e4;
      };

      // larghezza ogni step dell'asse X
      cfg.xStep = cfg.chart_area.width / 12;

      // coordinata x del mese dato
      const monthToX = month => Math.round(cfg.chart_area.left + ((Number(month) - 1) * cfg.xStep)) * 1e4 / 1e4;

      // console.log(cfg.chart_area.left);
      // console.log(((Number(1) - 1) * cfg.xStep));
      // console.log(monthToX(1));

      // contenitore coordinate paths
      let linePoints = {};

      // i cerchi (datapoints) corrispondenti ai vari valori vengono registrati
      // in questa variabile per essere possizionati in cima a a tutto
      let dataGroups= [];

      // array degli elementi Rect da associare agli eventi hover
      let hoverGridArray = [];

      // chiavi dell'array da rappresentare
      const keys = props.keys.reduce((result, curr) => {
        result.push(curr.key);
        return result;
      }, []);

      // inizializzazione contenitore coordinate
      keys.forEach(k => {
        linePoints[k] = [];
      });

      // =>> costruzione paths e punti
      chart_data.forEach((item,idx) => {

        const x = monthToX(item[props.monthKey]) + cfg.xStep/2,
          // dati per produrre il piccolo cerchio che evidenzia i vari punti
          dataGroupsY = {},
          dCommand = idx === 0? 'M': 'L';
        let y;

        keys.forEach(k => {
          if(item[k] != null) {
            y = valueToYCoord(item[k]);
            dataGroupsY[k] = y;
            linePoints[k].push(`${dCommand}${x},${y}`);
          }
        });


        // =>> dataGroup (punti e griglia x)
        dataGroups.push(
          <g
            key={item[props.monthKey]}
            data-month={item[props.monthKey]}
            className={styles.dataGroup}
          >
            {/* griglia x */}
            <line
              className={styles.gridLines}
              x1={x}
              y1={cfg.chart_area.top}
              x2={x}
              y2={cfg.chart_area.bottom}
            />

            {Object.keys(dataGroupsY).map(k => {
              const params = props.keys.filter(item => item.key === k)[0],
                dataPointClassnames = params.dataPointClassNames?
                  params.dataPointClassNames.map(c => styles[c]) : null;

              return <circle key={k}
                cx={x} cy={dataGroupsY[k]}
                className={classnames(styles.dataPoint, dataPointClassnames)}
              />;
            })}
          </g>
        ); // end dataGroups.push

        // =>> hoverGridArray (costruzione)
        // =>> listener Show/Hide InfoBox
        hoverGridArray.push(
          <rect
            key={item[props.monthKey]}
            data-month={item[props.monthKey]}
            x={x-cfg.xStep/2}
            y={cfg.chart_area.top}
            width={cfg.xStep}
            height={cfg.chart_area.height}
            fill="transparent"
            // fill={item[props.monthKey] % 2 ? 'rgba(255 0 0 / .3)' : 'rgba(0 255 0 / .3)'}

            onMouseOver={e => {
              const month = +e.target.dataset.month;

              // e.target.setAttribute('fill', 'rgba(255, 0, 0, .1)');

              setInfoBoxData({
                data: chart_data.filter(item=> +item[props.monthKey] === month)[0],
                month: month,
                dataGroupEl: svgRef.current.querySelector(`.${styles.dataGroup}[data-month='${item[props.monthKey]}']`)
              });
            }}

            onMouseOut={ () => {
              // e.target.setAttribute('fill', 'transparent');
              const dataGroupEl = svgRef.current.querySelector(`.${styles.dataGroup}[data-month='${item[props.monthKey]}']`);
              dataGroupEl?.classList.remove(styles.dataGroupOn);
              svgRef.current.classList.remove(styles.infoBoxWrapperOn);
              setInfoBoxData(null);
            }}
          />
        ); // end hoverGridArray.push


      }); // end chart_data.forEach


      // =>> setContent
      setContent(<>

        {/* =>> suddivisione in mesi
          inserimento di uno sfondo alternato con etichetta per evidenziare i mesi
        */}
        <g>
          {Object.keys(mesi_brevi).map(mese => {
            // inizio e fine della porzione
            const x_start = monthToX(mese),
              rect_width= cfg.xStep,
              rect_height = cfg.chart_area.height;

            return <Fragment key={mese}>
              {/* solo mesi dispari */}
              {mese % 2 && <rect
                x={x_start}
                y={cfg.chart_area.top}
                width={rect_width}
                height={rect_height}
                className={classnames({[styles.evenMonths]: mese % 2 === 0, [styles.oddMonths]: mese % 2})}
              />}
            </Fragment>;
          })}
        </g>


        {/* =>> linee grafico */}

        {Object.keys(linePoints).map(k => {
          const params = props.keys.filter(item => item.key === k)[0],
            lineClassnames = params.lineClassNames? params.lineClassNames.map(c => styles[c]) : null;

          return <path d={linePoints[k].join(' ')} key={k}
            className={classnames(styles.line, lineClassnames)} />;
        })}


        {/* =>> asse Y */}
        <line
          data-i='aY'
          x1={cfg.chart_area.left}
          y1={cfg.chart_area.top}
          x2={cfg.chart_area.left}
          y2={cfg.chart_area.bottom}
          className={styles.assi}
        />
        {/* asse X */}
        <line
          data-i='aX'
          x1={cfg.chart_area.left}
          y1={cfg.chart_area.bottom}
          x2={cfg.chart_area.right}
          y2={cfg.chart_area.bottom}
          className={styles.assi}
        />
        {/* chiusura area grafico a dx */}
        <line
          x1={cfg.chart_area.left + cfg.chart_area.width}
          y1={cfg.chart_area.top}
          x2={cfg.chart_area.left + cfg.chart_area.width}
          y2={cfg.chart_area.bottom}
          className={styles.gridLines}
        />

        {/* =>> ticks, griglia e valori asse y
          il numero degli step viene incrementato di 1 per includere il valore
          iniziale (0)
        */}
        <g>
          {Object.keys(mesi_brevi).map(mese => {
            //const y = cfg.chart_area.bottom - (idx * cfg.chart_area.yStep);
            const y =  valueToYCoord((mese-1) * cfg.asseY_step_val);
            let label = Math.ceil((cfg.asseY_step_val * (mese-1))/1000);

            label = label.toLocaleString('it-IT', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }) + (label > 0? '\u2009K' : '');

            return <Fragment key={mese}>
              <text
                x={cfg.chart_area.left - cfg.ticks - 2}
                y={y}
                dy='4px'
                className={styles.labelY}
              >{label}</text>
              <line
                className={styles.ticks}
                x1={cfg.chart_area.left - cfg.ticks}
                y1={y}
                x2={cfg.chart_area.left}
                y2={y}
              />
              <line
                className={styles.gridLines}
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
          {Object.keys(mesi_brevi).map(mese => {
            const x = monthToX(mese) + cfg.xStep/2;

            return <Fragment key={mese}>
              <text
                x={x}
                y={cfg.chart_area.bottom + cfg.ticks + 2}
                dy={8}
                className={styles.labelX}
              >{mesi_brevi[mese]}</text>

              {/* <line
                className={styles.ticks}
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
          className={styles.axisLabel}
          transform={`rotate(270 ${cfg.padding + 2} ${cfg.chart_area.top + cfg.chart_area.height/2})`}
        >Travel Value (partito)</text>

        {/* =>> applicazione griglia asse x e punti */}
        {dataGroups}

        {/* =>> legenda */}
        {props.legenda && <Legenda legenda={props.legenda} cfg={cfg} />}
      </>); // end setContent

      // =>> setHoverGrid
      setHoverGrid(hoverGridArray);

    } // end if(svgWidth && svgHeight)


  }, [cfg, props.dati, props.keys, props.legenda, props.monthKey, svgHeight, svgWidth]);

  // =>> posizionamento legenda
  useEffect(() => {
    if(content) {
      const legenda = svgRef.current.querySelector(`.${styles.legenda}`),
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
  }, [cfg.legenda.elements_gap, cfg.legenda.h, content, svgWidth]);

  return (<React.StrictMode>
    <div>
      <svg xmlns="http://www.w3.org/2000/svg"
        ref={svgRef}
        className={classnames(styles.chart, styles.chartMensile)}
      >
        {content}
        <InfoBox {...infoBoxData}
          year={props.anno}
          cfg={cfg}
          infoBoxItems={props.infoBoxItems}
          infoBoxPositionRefs={props.infoBoxPositionRefs}
          mode="month" />
        <g>{hoverGrid}</g>
      </svg>
    </div>
  </React.StrictMode>);
}


export default GraficoMensile;
