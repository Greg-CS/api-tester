import "dotenv/config";
import { PrismaClient } from "./generated/prisma/client";
import chalk from "chalk";
import chalkAnimation from "chalk-animation";

if (!process.env.DATABASE_URL) {
  throw new Error(chalk.red.bold("DATABASE_URL is required for seeding"));
}

const prisma = new PrismaClient({
  accelerateUrl: process.env.DATABASE_URL,
});

// Helper to sleep for animations
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Custom spinner loader
class Spinner {
  private frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  private currentFrame = 0;
  private interval: NodeJS.Timeout | null = null;
  private text: string;

  constructor(text: string) {
    this.text = text;
  }

  start() {
    process.stdout.write("\x1B[?25l"); // Hide cursor
    this.interval = setInterval(() => {
      const frame = chalk.cyan(this.frames[this.currentFrame]);
      process.stdout.write(`\r${frame} ${chalk.white(this.text)}`);
      this.currentFrame = (this.currentFrame + 1) % this.frames.length;
    }, 80);
    return this;
  }

  succeed(text: string) {
    this.stop();
    console.log(`\r${chalk.green("✅")} ${chalk.white(text)}`);
  }

  skip(text: string) {
    this.stop();
    console.log(`\r${chalk.yellow("⏭️ ")} ${chalk.gray(text)}`);
  }

  fail(text: string) {
    this.stop();
    console.log(`\r${chalk.red("❌")} ${chalk.red(text)}`);
  }

  private stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    process.stdout.write("\x1B[?25h"); // Show cursor
    process.stdout.write("\r" + " ".repeat(this.text.length + 10) + "\r"); // Clear line
  }
}

const seedRequests = [
  {
    name: "1. Create User (Thomas Devos)",
    url: "https://sandbox.array.io/api/user/v2",
    method: "POST",
    headers: "Content-Type: application/json; charset=utf-8",
    body: JSON.stringify({
      appKey: "3F03D20E-5311-43D8-8A76-E4B5D77793BD",
      firstName: "THOMAS",
      lastName: "DEVOS",
      dob: "1957-09-06",
      ssn: "666023511",
      phoneNumber: "4045049006",
      emailAddress: "tdevos@example.com",
      address: {
        street: "1206 BEAR CREEK RD APT 110",
        city: "TUSCALOOSA",
        state: "AL",
        zip: "35405"
      }
    }, null, 2),
  },
  {
    name: "2. Get Verification Questions (KBA)",
    url: "https://sandbox.array.io/api/authenticate/v2?appKey=3F03D20E-5311-43D8-8A76-E4B5D77793BD&userId={{USER_ID}}&provider1=exp",
    method: "GET",
    headers: "Content-Type: application/json; charset=utf-8",
    body: "",
  },
  {
    name: "3. Submit Verification Answers",
    url: "https://sandbox.array.io/api/authenticate/v2",
    method: "POST",
    headers: "Content-Type: application/json; charset=utf-8",
    body: JSON.stringify({
      appKey: "3F03D20E-5311-43D8-8A76-E4B5D77793BD",
      userId: "{{USER_ID}}",
      authToken: "{{AUTH_TOKEN}}",
      answers: {
        "{{QUESTION_1_ID}}": "{{ANSWER_1_ID}}",
        "{{QUESTION_2_ID}}": "{{ANSWER_2_ID}}",
        "{{QUESTION_3_ID}}": "{{ANSWER_3_ID}}"
      }
    }, null, 2),
  },
  {
    name: "4. Order Credit Report",
    url: "https://sandbox.array.io/api/report/v2",
    method: "POST",
    headers: "Content-Type: application/json; charset=utf-8\nx-array-user-token: {{USER_TOKEN}}",
    body: JSON.stringify({
      userId: "{{USER_ID}}",
      productCode: "exp1bReportScore"
    }, null, 2),
  },
  {
    name: "5. Retrieve HTML Credit Report",
    url: "https://sandbox.array.io/api/report/v2/html?reportKey={{REPORT_KEY}}&displayToken={{DISPLAY_TOKEN}}",
    method: "GET",
    headers: "Content-Type: application/json; charset=utf-8",
    body: "",
  },
];

async function main() {
  // Animated title
  const title = chalkAnimation.rainbow("🌱 Array.io Credit Report Flow - Database Seeder\n");
  await sleep(2000);
  title.stop();

  console.log(chalk.cyan.bold("━".repeat(50)));
  console.log(chalk.white.bold("  Seeding saved requests for credit report flow"));
  console.log(chalk.cyan.bold("━".repeat(50)) + "\n");

  let created = 0;
  let skipped = 0;

  for (const request of seedRequests) {
    const spinner = new Spinner(`Processing "${request.name}"...`);
    spinner.start();
    
    await sleep(500); // Show spinner for a moment

    const existing = await prisma.savedRequest.findFirst({
      where: { name: request.name },
    });

    if (existing) {
      spinner.skip(`Skipping "${request.name}" (already exists)`);
      skipped++;
      continue;
    }

    await prisma.savedRequest.create({
      data: request,
    });
    spinner.succeed(`Created "${request.name}"`);
    created++;
  }

  console.log("\n" + chalk.cyan.bold("━".repeat(50)));
  
  // Summary with animation
  const summary = chalkAnimation.pulse(
    `\n🎉 Seeding complete! Created: ${created} | Skipped: ${skipped}\n`
  );
  await sleep(2000);
  summary.stop();

  // Notes section
  console.log(chalk.magenta.bold("\n📝 Usage Notes:\n"));
  
  const notes = [
    ["{{USER_ID}}", "userId from step 1 response"],
    ["{{AUTH_TOKEN}}", "authToken from step 2 response"],
    ["{{QUESTION_X_ID}}", "question IDs from step 2"],
    ["{{ANSWER_X_ID}}", "answer IDs from step 2"],
    ["{{USER_TOKEN}}", "userToken from step 3 response"],
    ["{{REPORT_KEY}}", "reportKey from step 4 response"],
    ["{{DISPLAY_TOKEN}}", "displayToken from step 4 response"],
  ];

  for (const [placeholder, description] of notes) {
    console.log(
      chalk.gray("   • Replace ") +
      chalk.yellow.bold(placeholder) +
      chalk.gray(" with ") +
      chalk.white(description)
    );
  }

  console.log("\n" + chalk.green.bold("Happy testing! 🚀\n"));
}

main()
  .catch(async (e) => {
    const errorAnim = chalkAnimation.neon("\n❌ Seeding failed!\n");
    await sleep(1500);
    errorAnim.stop();
    console.error(chalk.red.bold("Error: "), chalk.red(e.message || e));
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
