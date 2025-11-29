import { CommandsRegistry, handlerAgg, handlerDelete, handlerFeed, handlerFeeds, handlerLogin, handlerRegsiter, handlerUsers, runCommand } from "./commands.js";

async function main() {
  const CommandsRegistry: CommandsRegistry = {
    login: handlerLogin,
    register: handlerRegsiter,
    reset: handlerDelete,
    users: handlerUsers,
    agg: handlerAgg,
    addfeed: handlerFeed,
    feeds: handlerFeeds,
  }
  const commands = process.argv.slice(2);
  const [cmdName, ...args] = commands;
  await runCommand(CommandsRegistry, cmdName, ...args);
  process.exit(0);
}

main();