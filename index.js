#!/usr/bin/env node
//Shebang line: #!/usr/bin/env node - This line specifies the path to the Node.js interpreter, 
//allowing the script to be executed directly from the command line.
const { CohereClient } = require('cohere-ai');
const { program } = require('commander');
const commandsDB = require('./git_commands.json'); // Adjust the path as needed
const { execSync } = require('child_process');

const cohereClient = new CohereClient({
  token: 'tkhCHTdt5MtuFdc7uB7o1XrhHJFFrY6nt63DpsC6'
});

program
  .name("shellbuddy")
  .description("CLI tool to provide git commands for common operations")
  .version("1.0.0-beta.1");

function executeGitCommands(commands) {
  commands.forEach(command => {
    console.log(`Executing: ${command}`);
    try {
      const result = execSync(command, { stdio: 'pipe', encoding: 'utf-8' });
      console.log(result);
    } catch (error) {
      console.error(`Error executing command '${error.cmd}': ${error.message}`);
    }
  });
}

// Specific command for handling commits
program.command('commit <message...>')
  .description("Commit changes with a message")
  .action((messageParts) => {
    const commitMessage = messageParts.join(' '); // Correctly join the commit message parts.
    const commands = [
      "git add .",
      `git commit -m "${commitMessage}"`,
      "git push"
    ];
    executeGitCommands(commands);
  });


// Define a new CLI command 'cohere' that takes one argument <message>
program
  .command('cohere <message>') // Define command syntax with <message> as a required parameter
  .description('Interact with Cohere LLM using chatStream') // Add a description to the command for help documentation
  .action(async (message) => { // Define the action to execute when this command is invoked. It's an async function to handle asynchronous API calls
    const params = {
      model: 'command-r-plus', // Hardcode the model to 'command-r-plus'
      message: message, // Pass the user's message to the Cohere API
      temperature: 0.3, // Set a hardcoded temperature value to control randomness
      promptTruncation: "AUTO", // Set prompt truncation to auto
      connectors: [{"id":"web-search"}] // Include a connector for web search to enrich responses
    };

    try {
      // Call the Cohere chatStream API with the parameters defined above
      const stream = await cohereClient.chatStream(params);
      // Process each piece of text generated by the chat stream
      for await (const chat of stream) {
        if (chat.eventType === "text-generation") { // Check if the event type is 'text-generation'
          process.stdout.write(chat.text); // Write the generated text to the standard output
        }
      }
    } catch (error) {
      // If an error occurs, print the error message to the console
      console.error('Error interacting with Cohere LLM:', error.message);
    }
  });

program.command('display')
  .description('Display all available commands')
  .action(() => {
    console.log('Available Commands:');
    for (const query in commandsDB.buddy) {
      console.log(`- ${query}`);
    }
  });

//system stats command
program.command('systemstats')
  .description("Run htop to view system statistics")
  .action(() => {
    console.log("buddy running htop...");
    try {
      const result = execSync('htop', { stdio: 'inherit' }); // Use stdio: 'inherit' to display the output in the console.
    } catch (error) {
      console.error(`Error executing htop: ${error.message}`);
    }
  });

program
  .command('help', { isDefault: true })
  .description('Display help for using ShellBuddy')
  .action(() => {
    program.outputHelp();
  });

console.log(program);

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

module.exports = { program, executeGitCommands };
