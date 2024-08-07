const { Client, GatewayIntentBits, Partials } = require('discord.js');
require('dotenv').config();
const fs = require('fs')

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages], 
  partials: [
    Partials.Channel,
    Partials.Message
] });

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  const interval = setInterval(async () => {
    const data = await fetch("https://files.thisisnotawebsitedotcom.com/is-it-time-yet/well-is-it.txt").then(response => response.text());
    console.log(data)
    if (data !== "NO"){
      console.log("UPDATE")
      sendMessageToAllUsers(`@everyone\nThe website has been updated to the following\n\n"${data}"`)
      clearInterval(interval)
    }
  }, 1000);
});

client.on('messageCreate', async message => {
    console.log(message.channel.type)
    if (message.channel.type === 1 && !message.author.bot) {
      await addUserToFile(message.author)
    }
});

async function addUserToFile(user) {
  const userFileData = await fs.promises.readFile(`./database/users.json`, 'utf-8');
  const userFile = JSON.parse(userFileData);

  const userDM = await client.users.fetch(user.id);

  const userExists = userFile.some(existingUser => existingUser.id === user.id);

  if (userExists) {
    console.log(`User with ID ${user.id} already exists.`);
    await userDM.send("You're already in the database.");
    return;
  }


  const profile = {
    id: user.id,
    name: user.name,
    date: Date.now() 
  }

  userFile.push(profile)

  console.log("Saving to file...")
  try {
    await fs.promises.writeFile(`./database/users.json`, JSON.stringify(userFile, null, 2));
    console.log("Saved successfully!")
    await userDM.send('Saved id successfully! You will be pinged when the website updates.');
  } catch(error){
    console.log(error)
    await userDM.send('There was an error when trying to save your id.');
  }
}

async function sendMessageToAllUsers(messageContent) {
  try {
    const userFileData = await fs.promises.readFile(`./database/users.json`, 'utf-8');
    const userFile = JSON.parse(userFileData);

    for (const user of userFile) {
      try {
        const userDM = await client.users.fetch(user.id);
        await userDM.send(messageContent);
        console.log(`Sent message to ${user.name}`);
      } catch (error) {
        console.error(`Could not send message to ${user.name}:`, error);
      }
    }
  } catch (error) {
    console.error("An error occurred while reading the user file:", error);
  }
}

client.login(process.env.TOKEN);
