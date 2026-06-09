import classnames from 'classnames';
import { useState, useEffect, useRef, Fragment } from 'react';
import PropTypes from 'prop-types';
// import styles from '../charts-base.module.scss';
import { nanoid } from 'nanoid';


/*
InfoBox versione su grafico linee



function InfoBox({
  year = new Date().getFullYear(),
  infoBoxItems = [],
  infoBoxPositionRefs = [],
  cfg = {},
  mode = 'week',
  data,
  week,
  month,
  dataGroupEl,
  skipWeek0
}) {
  const [content, setContent] = useState(null),
    infoBoxWrapperRef = useRef();


  const weekMode = useMemo(() => {
      return mode === 'week';
    }, [mode]),
    infoBoxWidth = useMemo(() => {
      return weekMode? 300 : 240;
    }, [weekMode]);

  useEffect(() => {

    // =>> getDatesOfWeek
    const getDatesOfWeek = week => {
      if(week) {

        let startDay, endDay;
        const daysToFirstMonday =  cfg.jan1DayOfTheWeek === 1? 0 : cfg.jan1DayOfTheWeek === 0? 1 :  8 - cfg.jan1DayOfTheWeek;
        // primo lunedì dell'anno
        const firstMonday = daysToFirstMonday === 0 ? cfg.jan1 : new Date(+cfg.jan1 + daysToFirstMonday * 86400e3);

        const dec31 = new Date(year, 11, 31),
          lastDayOfLastWeek = new Date(+firstMonday + ((week - 1) * 7 * 86400e3) + (86400e3 * 6) );

        // forza il primo giorno della prima settimana al 1 gennaio anche se non è lunedì
        if(week === 1) {
          startDay =  cfg.jan1;
        } else {
          startDay = new Date(firstMonday.valueOf());
          startDay = new Date(startDay.setDate(startDay.getDate() + 7 * (week - 2)));
        }

        // prima settimana con più di 4 gg, viene considerata a se stante
        endDay = new Date(startDay.valueOf());
        if(week === 1 && cfg.jan1DayOfTheWeek < 5) {
          endDay = new Date(endDay.setDate(endDay.getDate() + 7 - cfg.jan1DayOfTheWeek));
        } else {
          endDay = new Date(endDay.setDate(endDay.getDate() + 6));
        }

        // forza l'ultmo giorno dell'ultima settimana al 31 dic anche se non è domenica
        // e si tratta dell'ultima settimana
        if(endDay.getFullYear() > year || week === cfg.weeks) {
          endDay = dec31;
        }


        // nel caso in cui la settimana sia la prima o l'ultima,viene restituito un terzo elemento
        // a indicare, rispettivamente, se 1 gennaio corrisponde all'inizio reale della 1a settimana
        // o se 31 dic corrisponde all'ultimo giorno dell'ultima settimana

        if(week === 1) {
          return [startDay, endDay, +firstMonday === +cfg.jan1];

        } else if (week === cfg.weeks) {
          return [startDay, endDay, +dec31 === +lastDayOfLastWeek];

        } else {
          return [startDay, endDay];
        }

      } else {
        return null;
      }


    };

    if(data) {

      const weekDates = getDatesOfWeek(data.w),
        dateToLocalOptions = {
          month: 'long',
          day: 'numeric'
        },
        setDateRangeText = () => {
          if(data.w === 0) {
            return null;

          } else {
            return <>
              <span className="text-nowrap">
                {weekDates[0].toLocaleString('it-IT',
                  weekDates[0].getMonth() !== weekDates[1].getMonth()? dateToLocalOptions
                    : {day: 'numeric'}
                )}
              </span>
              {' \u2013 '}
              <span className="text-nowrap">{weekDates[1].toLocaleString('it-IT', dateToLocalOptions)}</span>
            </>;
          }
        };

      //weeks:
      //props.data : {
      //    "w": 0,       <- settimana, 0 = anno prec.
      //    "s": 519096,  <- budget standard
      //    "p": 812136,  <- budget positivo
      //    "n": 43242,   <- budget negativo
      //    "c": 674824   <- budget consolidato (null se non presente)
      //    "cp": 612345  <- budget consolidato anno precedente
      //  }



      setContent(<>

        //  {weekMode?
        //   <>
        //     <div className={styles.infoBoxTitle}>{props.data.w? <>Settimana {props.data.w}</> : <>Anno precedente</>}</div>
        //     <div className={styles.infoBoxDescr}>{setDateRangeText()}</div>
        //   </>
        //   :
        //   <>{mesi[props.month]}</>
        // }

        <div className={styles.infoBoxTitle}>{data.w? <>Settimana {data.w}</> : <>Anno precedente</>}</div>
        <div className={styles.infoBoxDescr}>{setDateRangeText()}</div>

        <table className={styles.infoBoxTable}>
          <tbody>
            {infoBoxItems.map((item, idx) => {

              return <tr key={nanoid()}>
                <th scope="row" className={item.tdClassName}>
                  {item.flagClassName && <span className={classnames(styles.infoBoxFlag, item.flagClassName)} />}
                  {item.label}
                </th>
                <td className={item.tdClassName}>{data[item.key] != null?
                  <span className="euro">{data[item.key].toLocaleString('it-IT')}</span>
                  : '\u2014'}
                </td>
                // =>> infobox: incremento
                {(data[item.key] != null && idx === 0)?
                  <td className='pl-2 align-baseline' rowSpan={Object.keys(infoBoxItems).length}>
                    {formatDelta(data.c, data.cp)}
                  </td>
                  : ''
                }
              </tr>;
            })}
          </tbody>
        </table>


        // weekDates[3] (true/false) è presente solo per la prima e l'ultima settimana
        {weekMode && <>
          {data.w === 1 && !weekDates[3] &&
            <div className={styles.infoBoxNote}>
              NB: sono inclusi anche i giorni precedenti al primo lunedì dell’anno.
            </div>
          }
          {data.w === cfg.weeks && !weekDates[3] &&
            <div className={styles.infoBoxNote}>
              NB: sono inclusi anche i giorni successivi alla domenica dell’ultima settimana.
            </div>
          }
        </>}

      </>);
    }
  }, [cfg.jan1, cfg.jan1DayOfTheWeek, cfg.weeks, data, infoBoxItems, month, year, weekMode]);

  useEffect(() => {
    if(dataGroupEl && (week != null || month != null)) {

      const infoBoxMargin = 8; // distanza dalla linea della griglia della settimana in esame

      // lato in cui posizionare InfoBox rispetto all'asse della settimana
      let side;
      if(weekMode) {
        side = week > cfg.weeks/2? 'left' : 'right';
      } else {
        side = month > 5? 'left' : 'right';
      }

      dataGroupEl?.classList.add(styles.dataGroupOn);
      dataGroupEl?.closest(`.${styles.chart}`)?.classList.add(styles.infoBoxWrapperOn);

      infoBoxWrapperRef.current.setAttribute('transform-origin',
      `${side === 'left'? 'right' : 'left'} top`
      );

      infoBoxWrapperRef.current.dataset.side = side;
      const infoBoxSize = infoBoxWrapperRef.current.querySelector(':scope > div').getBoundingClientRect();
      // infoBoxWrapperRef.current.setAttribute('height', infoBoxSize.height);
      // infoBoxWrapperRef.current.setAttribute('width', infoBoxSize.width);

      // let puntoRif;
      // for(const ref of infoBoxPositionRefs) {
      //   puntoRif = dataGroupEl.querySelector(`.${styles[ref]}`);
      //   if(puntoRif) {
      //     break;
      //   }
      // }

      // let y = puntoRif? +puntoRif.getAttribute('cy') : Infinity;
      // y = Math.min(y, cfg.chart_area.top + cfg.chart_area.height - infoBoxSize.height - 5);

      // posizionamento vicino alle asse X
      let y = cfg.chart_area.top + cfg.chart_area.height - infoBoxSize.height - 5;
      infoBoxWrapperRef.current.setAttribute('y', y);

      let transformX = weekMode?
        cfg.chart_area.left + ((week - (skipWeek0? 1 : 0)) * cfg.xStep) +
        (side === 'left'? -infoBoxWidth - infoBoxMargin : infoBoxMargin)
        :
        cfg.chart_area.left + ((month - 1) * cfg.xStep) +
        (side === 'left'? -infoBoxWidth - infoBoxMargin: infoBoxMargin) +
        cfg.xStep / 2;

      infoBoxWrapperRef.current.setAttribute('transform', `translate(${transformX} 0)`);


    }

  }, [infoBoxWidth, cfg, dataGroupEl, infoBoxPositionRefs, month, skipWeek0, week, weekMode]);


  return (
    <foreignObject className={styles.infoBoxWrapper}
      x="0" y="-1000"
      width={infoBoxWidth}
      height={300}
      ref={infoBoxWrapperRef}
    >
      <div xmlns="http://www.w3.org/1999/xhtml">
        {content}
      </div>
      // <div xmlns="http://www.w3.org/1999/xhtml" style={{
      //   position: 'absolute',
      //   top: 0, left: 0,
      //   width: '100%', height: '100%',
      //   backgroundColor: 'rgba(255,0,0, .2)'
      // }}></div>
    </foreignObject>
  );

InfoBox.propTypes = {
  data                    : PropTypes.object,
  week                    : PropTypes.number,
  month                   : PropTypes.number,
  dataGroupEl             : PropTypes.any,
  year                    : PropTypes.number,
  cfg                     : PropTypes.object,
  mode                    : PropTypes.oneOf(['month', 'week']),

  // array di classi di elementi all'interno di dataGroupEl dai quali ricavare
  // la coordinata y per il posizionamento di InfoBox
  // almeno uno deve essere sicuramente presente
  infoBoxPositionRefs     : PropTypes.arrayOf(PropTypes.string),

  // elementi, etichette, classe td e classe indicatore colorato per la costruzione dell'infoBox
  // nell'ordine in cui verranno mostrate
  infoBoxItems            : PropTypes.arrayOf(
    PropTypes.shape({
      key                 : PropTypes.string,
      label               : PropTypes.string,
      tdClassName         : PropTypes.string,
      flagClassName       : PropTypes.string,
      dataPointClassName  : PropTypes.string
    })
  )

};

*/


function InfoBox({
  data,
  dataGroupEl,
  cfg,
  // mode, // da eliminare
  infoBoxWidth,
  elementsCount,
  styles,
  title,
  year                 = new Date().getFullYear(),
  infoBoxItems         = [],
  // infoBoxPositionRefs  = [],
  extraRows            = null
}) {
  const [content, setContent] = useState(null),
    infoBoxWrapperRef = useRef();

  useEffect(() => {

    if(data) {


      setContent(<>

        <div className={styles.infoBoxTitle}>{title}</div>

        <table className={styles.infoBoxTable}>
          <tbody>
            {infoBoxItems.map(item => {
              return <tr key={nanoid()}>
                <th scope="row" className={classnames(item.tdClassName)}>
                  {item.flagClassName && <span className={classnames(styles.infoBoxFlag, item.flagClassName)} />}
                  {item.label}
                </th>
                <td className={classnames(item.tdClassName)}>{data[item.key] != null?
                  <span className="euro">{data[item.key].toLocaleString('it-IT')}</span>
                  :
                  '—'}
                </td>
              </tr>;
            })}
            {extraRows.map(row => {
              return <tr key={nanoid()}>
                <th scope="row">{row.label}</th>
                <td>{row.value? row.value : '—'}  </td>
              </tr>;
            })}
          </tbody>
        </table>

      </>);
    }
  }, [cfg, data, extraRows, infoBoxItems, styles, title, year]);

  useEffect(() => {
    if(dataGroupEl) {

      const infoBoxMargin = 8; // distanza dalla linea della griglia della settimana in esame

      // lato in cui posizionare InfoBox rispetto all'asse della settimana
      const xKey = dataGroupEl.dataset.xKey,
        side = xKey > Math.floor(elementsCount/2)-1? 'left' : 'right';


      dataGroupEl.classList.add(styles.dataGroupOn);
      dataGroupEl.closest(`.${styles.chart}`).classList.add(styles.infoBoxWrapperOn);

      infoBoxWrapperRef.current.setAttribute('transform-origin',
      `${side === 'left'? 'right' : 'left'} top`
      );

      infoBoxWrapperRef.current.dataset.side = side;
      // const infoBoxSize = infoBoxWrapperRef.current.querySelector(':scope > div').getBoundingClientRect();
      // infoBoxWrapperRef.current.setAttribute('height', infoBoxSize.height);
      // infoBoxWrapperRef.current.setAttribute('width', infoBoxSize.width);

      // let puntoRif;
      // for(const ref of infoBoxPositionRefs) {
      //   puntoRif = dataGroupEl.querySelector(`.${styles[ref]}`);
      //   if(puntoRif) {
      //     break;
      //   }
      // }

      // let y = puntoRif? +puntoRif.getAttribute('cy') : Infinity;
      // y = Math.min(y, cfg.chart_area.top + cfg.chart_area.height - infoBoxSize.height - 5);

      // posizionamento vicino alle asse X
      // let y = cfg.chart_area.top + cfg.chart_area.height - infoBoxSize.height - 5;
      // infoBoxWrapperRef.current.setAttribute('y', y);

      // il metodo precedente provoca all'inizio un posizionamento errato sull'asse y
      infoBoxWrapperRef.current.setAttribute('y', cfg.chart_area.top +10);

      let transformX = cfg.chart_area.left + (xKey * cfg.xStep) +
        (side === 'left'? -infoBoxWidth - infoBoxMargin - cfg.xStep * .8 : infoBoxMargin);

      infoBoxWrapperRef.current.setAttribute('transform', `translate(${transformX} 0)`);

    }

  }, [infoBoxWidth, cfg, dataGroupEl, styles, elementsCount]);


  return (
    <foreignObject className={styles.infoBoxWrapper}
      x="0" y="-1000"
      width={infoBoxWidth}
      height={300}
      ref={infoBoxWrapperRef}
    >
      <div xmlns="http://www.w3.org/1999/xhtml">
        {content}
      </div>
      {/* <div xmlns="http://www.w3.org/1999/xhtml" style={{
        position: 'absolute',
        top: 0, left: 0,
        width: '100%', height: '100%',
        backgroundColor: 'rgba(255,0,0, .2)'
      }}></div> */}
    </foreignObject>
  );
}

InfoBox.propTypes = {
  data                    : PropTypes.object,
  dataGroupEl             : PropTypes.any,
  year                    : PropTypes.number,
  cfg                     : PropTypes.object,

  // da eliminare
  // mode                    : PropTypes.string,

  // array di classi di elementi all'interno di dataGroupEl dai quali ricavare
  // la coordinata y per il posizionamento di InfoBox
  // almeno uno deve essere sicuramente presente
  // infoBoxPositionRefs     : PropTypes.arrayOf(PropTypes.string),

  // elementi, etichette, classe td e classe indicatore colorato per la costruzione dell'infoBox
  // nell'ordine in cui verranno mostrate
  infoBoxItems            : PropTypes.arrayOf(
    PropTypes.shape({
      key                 : PropTypes.string,
      label               : PropTypes.string,
      tdClassName         : PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
      flagClassName       : PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
    })
  ),

  // larghezza da assegnare all'elemento foreignObject
  infoBoxWidth: PropTypes.number,

  // numero di elementi sui quali mostrare infoBox (per la posizione dx o sx)
  elementsCount: PropTypes.number,

  /** righe extra da aggiungere alla infobox */
  extraRows: PropTypes.array

};


export default InfoBox;
