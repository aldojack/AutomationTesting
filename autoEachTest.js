const puppeteer = require("puppeteer");
const lighthouse = require("lighthouse");
const exceljs = require("exceljs");
const fs = require("fs");

const websites = [
  { url: "https://recipe-man-react.netlify.app/", name: "React" },
  { url: "https://recipe-man-vue.netlify.app/", name: "Vue" },
];

const testScenarios = [
  { description: "Add 1 Recipe", buttonToClick: "#addOne" },
  { description: "Add 100 Recipes", buttonToClick: "#addHundred" },
  { description: "Add 1000 Recipes", buttonToClick: "#addThousand" },
];

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--remote-debugging-port=9222"],
  });

  const fileName = "performance_metrics.xlsx";
  let workbook;
  try {
    await fs.promises.access(fileName);
    workbook = new exceljs.Workbook();
    await workbook.xlsx.readFile(fileName);
  } catch (err) {
    workbook = new exceljs.Workbook();
  }

  let worksheet = workbook.getWorksheet("Performance Metrics");
  if (!worksheet) {
    worksheet = workbook.addWorksheet("Performance Metrics");
  }

  worksheet.columns = [
    { header: "Website", key: "url", width: 30 },
    { header: "Test Scenario", key: "testScenario", width: 20 },
    { header: "Date", key: "date", width: 20 },
    {
      header: "First Contentful Paint",
      key: "firstContentfulPaint",
      width: 20,
    },
    { header: "Time to Interactive", key: "timeToInteractive", width: 20 },
    { header: "Speed Index", key: "speedIndex", width: 20 },
    { header: "Total Blocking Time", key: "totalBlockingTime", width: 20 },
    {
      header: "Largest Contentful Paint",
      key: "largestContentfulPaint",
      width: 20,
    },
    {
      header: "Cumulative Layout Shift",
      key: "cumulativeLayoutShift",
      width: 20,
    },
  ];

  for (const website of websites) {
    for (const testScenario of testScenarios) {
      //Run each test 40 times each for 25 days (1,000 each)
      for (let i = 0; i < 40; i++) {
        const page = await browser.newPage();
        await page.goto(website.url);

        await page.waitForSelector("#deleteAll", { visible: true, timeout: 0 });
        await page.click("#deleteAll");
        await page.click(testScenario.buttonToClick);

        // Run Lighthouse on the website
        const results = await lighthouse(website.url, {});

        worksheet.addRow({
          url: website.name,
          testScenario: testScenario.description,
          date: new Date().toLocaleDateString(),
          firstContentfulPaint: parseFloat(
            results.lhr.audits["first-contentful-paint"].displayValue.replace(
              /s/g,
              ""
            )
          ),
          timeToInteractive: parseFloat(
            results.lhr.audits["interactive"].displayValue.replace(/s/g, "")
          ),
          speedIndex: parseFloat(
            results.lhr.audits["speed-index"].displayValue.replace(/ms/g, "")
          ),
          totalBlockingTime: parseFloat(
            results.lhr.audits["total-blocking-time"].displayValue
              .match(/\d+/g)
              .join("")
          ),
          largestContentfulPaint: parseFloat(
            results.lhr.audits["largest-contentful-paint"].displayValue.replace(
              /s/g,
              ""
            )
          ),
          cumulativeLayoutShift: parseFloat(
            results.lhr.audits["cumulative-layout-shift"].displayValue
          ),
        });
        console.log(
          `${website.url} - ${testScenario.description} - iteration ${i} complete`
        );
        await page.close();
      }
    }
  }

  // Save the workbook to a file
  try {
    await workbook.xlsx.writeFile(`F:\\Coding\\AutomationTesting\\${fileName}`);
  } catch (error) {
    console.log(error)
  }
  console.log(
    "Performance metrics have been saved to performance_metrics.xlsx"
  );
  await browser.close();
})();
