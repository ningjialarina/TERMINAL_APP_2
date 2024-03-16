import { ask, say } from "./shared/cli.js";
import { gptPrompt } from "./shared/openai.js";
import figlet from "npm:figlet@1.6.0";
import dedent from "npm:dedent@1.5.1";
import boxen from "npm:boxen@7.1.1";
import chalk from "npm:chalk@5.3.0";

console.log(
  chalk.cyan(figlet.textSync("Health Assistant", { horizontalLayout: "full" }))
);

// Generate a question based on the context and user response
async function generateQuestion(currentContext, userResponse) {
  const prompt =
    userResponse.toLowerCase() === "yes"
      ? `Given the user's previous interest, generate a second question about ${currentContext}.Do only ask questions with answers in yes or no.`
      : `Generate a new simple question directly you did not asked before about what other body part discomfort do they have that unrelated to ${currentContext} in 10 words.
      Do only ask questions with answers in yes or no. `;

  const nextQuestionResponse = await gptPrompt(prompt, {
    max_tokens: 100,
    temperature: 0.7,
  });
  return nextQuestionResponse; // Assuming this returns a string directly for simplicity
}

// Main function
async function main() {
  say(
    boxen(
      chalk.yellow(
        "How are u!🙌 I'm here to help you assess which part of your body is currently feeling the most uncomfortable.😰 Please respond to the following questions with 'yes' or 'no' only."
      ),
      {
        padding: 1,
        margin: 1,
        borderColor: "yellow",
        borderStyle: "classic",
      }
    )
  );

  let currentContext = "discomfort"; // Starting topic
  let userResponse = ""; // To capture user responses
  let reportedDiscomfort = []; // List to track which parts the user reports discomfort in
  let questionCount = 0; // To control the number of questions asked
  let skipToConclusion = false; // Flag to track when to skip to conclusion

  // Loop to continue asking questions based on GPT-generated follow-ups
  while (questionCount < 4 && !skipToConclusion) {
    // Generate or set the next question
    let question =
      questionCount === 0
        ? "Do you currently experience any discomfort in your neck or back?"
        : await generateQuestion(currentContext, userResponse);

    userResponse = await ask(chalk.cyan(question));

    if (userResponse.toLowerCase() === "yes") {
      reportedDiscomfort.push(question); // Add the current question to reported discomfort
    }

    if (questionCount === 1 && userResponse.toLowerCase() === "no") {
      // Skip to conclusion if no new discomfort is reported after a specific inquiry
      skipToConclusion = true;
    }

    questionCount++; // Increment the question count
  }

  // Provide advice based on user feedback
  if (reportedDiscomfort.length > 0) {
    const discomfortsForPrompt = reportedDiscomfort.join(", ");
    const advicePrompt = `Based on the reported discomforts: ${discomfortsForPrompt}. Please give corresponding advice for each, no more than 50 words. Do not say you are an AI.`;
    const reportedDiscomfortString = await gptPrompt(advicePrompt, {
      max_tokens: 700,
      temperature: 0.3,
    });

    //BASIC ADVICE
    const basicAdvice = `Here are the advices for your discomforts:\n${reportedDiscomfortString}`;
    say(
      boxen(chalk.green(basicAdvice), {
        padding: 1,
        borderColor: "green",
        borderStyle: "round",
      })
    );

    // Further inquire if the user is interested in receiving TCM advice
    const tcmInterestQuestionPrompt = `Generate a polite and engaging question directly asking if the user is interested in receiving further Traditional Chinese Massage (TCM) advice based on their discomfort. Introduce Traditional Chinese Massage briefly in a 40 words paragraph.`;
    const tcmInterestQuestionString = await gptPrompt(
      tcmInterestQuestionPrompt,
      {
        max_tokens: 700,
        temperature: 0.5,
      }
    );

    userResponse = await ask(chalk.cyan(tcmInterestQuestionString));

    //TCM Point
    if (userResponse.toLowerCase() === "yes") {
      const tcmAdvicePrompt = `Based on the discomforts reported: ${discomfortsForPrompt}, provide Traditional Chinese Medicine point advice for each discomfort. Only include specific body points, points information, and function. Do not say you are an AI.`;
      const tcmAdvice = await gptPrompt(tcmAdvicePrompt, {
        max_tokens: 1024,
        temperature: 0.5,
      });

      console.log(); // Print an empty line for spacing
      console.log(
        boxen(dedent`\n${tcmAdvice}`, {
          title: "Great! Let's proceed with the TCM point advice.",
          padding: 1,
          borderColor: "green",
          borderStyle: "round",
        })
      );
      console.log(); // Print an empty line for spacing

      //Massage Instructions
      const massageInstructions = `Only give massage instrutions about \n${tcmAdvice} in 50 words.Do not say you are an AI.`;
      const tcmAdvice2 = await gptPrompt(massageInstructions, {
        max_tokens: 50,
        temperature: 0.5,
      });
      console.log(); // Print an empty line for spacing
      console.log(
        boxen(dedent`\n${tcmAdvice2}`, {
          title: "Massage Instrutions",
          padding: 1,
          borderColor: "green",
          borderStyle: "round",
        })
      );
      console.log(); // Print an empty line for spacing

      //Caution
      const Caution = `Give a caution sentence. Do not say you are an AI.These advices are only for people who do not want to do acupuncture. Do not try if pregnant or have serious illness, go to hospital.`;
      const tcmAdvice3 = await gptPrompt(Caution, {
        max_tokens: 50,
        temperature: 0.5,
      });

      // Using console.log for printing to the console. Replace with your print function if necessary.
      console.log(); // Print an empty line for spacing
      console.log(
        boxen(dedent`\n${tcmAdvice3}`, {
          title: "Caution",
          padding: 1,
          borderColor: "red",
          borderStyle: "round",
        })
      );
      console.log(); // Print an empty line for spacing

      // Tuina Plan
      const tuinaPlan = `Give a specialized Tuina (massage) treatment plan directly for several weeks based on \n${tcmAdvice}. A general guidline, do not be so specific and serious. Do not say you are an AI.`;
      const tcmAdvice4 = await gptPrompt(tuinaPlan, {
        max_tokens: 1000,
        temperature: 0.5,
      });

      console.log(); // Print an empty line for spacing
      console.log(
        boxen(dedent`\n${tcmAdvice4}`, {
          title: "Your Long-term Maintenance",
          padding: 1,
          borderColor: "green",
          borderStyle: "round",
        })
      );
    } else {
      say(
        "Thank you for your time. Feel free to come back if you need more help."
      );
    }
  } else {
    say(
      "Thank you for your time. Feel free to come back if you need more help."
    );
  }
}

main();
