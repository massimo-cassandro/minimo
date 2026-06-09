
export function pieTest(cfg) {

  cfg.charts.pie({
    container: '#pie',
    radius: 50,
    values: Object.values(cfg.testValues)
  });
  cfg.charts.pie({
    container: '#donut',
    innerRadius: 20,
    radius: 50,
    values: Object.values(cfg.testValues)
  });

}
