

export async function pieNodeTest(cfg) {

  const pie_svg = cfg.charts.pie({
    innerRadius: 30,
    radius: 50,
    values: Object.values(cfg.testValues)
  });

  await cfg.writeFile(pie_svg, 'pie.svg');
}
