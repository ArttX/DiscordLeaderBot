const Discord = require('discord.js');
const config = require("./config.json");
const sqlite = require('sqlite3').verbose();
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });

let userApplications = {};

client.on('ready', () => {
    console.log("Bot is ready!");
    client.user.setActivity('for best helpers', { type: 'WATCHING'});
    //Creating database file
    let db = new sqlite.Database('./LeaderBotDB.db', sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE);
    let el = new sqlite.Database('./eventMemberList.db', sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE);
    //Creating table
    db.run(`CREATE TABLE IF NOT EXISTS scoreData(userid INTEGER NOT NULL, username TEXT NOT NULL, score INTEGER NOT NULL, level INTEGER NOT NULL)`);
    el.run(`CREATE TABLE IF NOT EXISTS eventMemberList(userid INTEGER NOT NULL, username TEXT NOT NULL, name TEXT NOT NULL, surname TEXT NOT NULL, interest TEXT NOT NULL, event TEXT NOT NULL)`);
});

client.login(config.token);  //Login in to discord

//#region Functions
function dbSetData(authorID, score, level) {
    let db = new sqlite.Database('./LeaderBotDB.db', sqlite.OPEN_READWRITE);
    db.run(`UPDATE scoreData SET score = ?, level = ? WHERE userid = ?`, [score, level, authorID]);
    console.log("- Data written to DB: score: " + score + ", level: " + level);
    return;
};
function roleGiver(score) {
    let role;
    if (score <= config.lvl_m3) {
        role = config.lvl_m3_role;
    } 
    else if ((score <= config.lvl_m2) && (score > config.lvl_m3)) {
        role = config.lvl_m2_role;
    } 
    else if ((score <= config.lvl_m1) && (score > config.lvl_m2)) {
        role = config.lvl_m1_role;
    } 
    else if ((score > config.lvl_m1) && (score < config.lvl_1)) {
        role = config.lvl_0_role;
    } 
    else if ((score >= config.lvl_1) && (score < config.lvl_2)) {
        role = config.lvl_1_role;
    }
    else if ((score >= config.lvl_2) && (score < config.lvl_3)) {
        role = config.lvl_2_role;
    }
    else if ((score >= config.lvl_3) && (score < config.lvl_4)) {
        role = config.lvl_3_role;
    }
    else if ((score >= config.lvl_4) && (score < config.lvl_5)) {
        role = config.lvl_4_role;
    }
    else if (score >= config.lvl_5) {
        role = config.lvl_5_role;
    } return role;
};
function roleRemoverPlus(score) {
    let role;
    if (score >= config.lvl_5) {
        role = config.lvl_4_role;
    }
    else if (score >= config.lvl_4) {
        role = config.lvl_3_role;
    }
    else if (score >= config.lvl_3) {
        role = config.lvl_2_role;
    }
    else if (score >= config.lvl_2) {
        role = config.lvl_1_role;
    }
    else if (score >= config.lvl_1) {
        role = config.lvl_0_role;
    }
    else if (score > config.lvl_m1) {
        role = config.lvl_m1_role;
    }
    else if (score > config.lvl_m2) {
        role = config.lvl_m2_role;
    }
    else if (score > config.lvl_m3) {
        role = config.lvl_m3_role;
    };
    return role;
};
function roleRemoverMinus(score) {
    let role;
    if (score <= config.lvl_m3) {
        role = config.lvl_m2_role;
    }
    else if (score <= config.lvl_m2) {
        role = config.lvl_m1_role;
    }
    else if (score <= config.lvl_m1) {
        role = config.lvl_0_role;
    }
    else if (score < config.lvl_1) {
        role = config.lvl_1_role;
    }
    else if (score < config.lvl_2) {
        role = config.lvl_2_role;
    }
    else if (score < config.lvl_3) {
        role = config.lvl_3_role;
    }
    else if (score < config.lvl_4) {
        role = config.lvl_4_role;
    }
    else if (score < config.lvl_5) {
        role = config.lvl_5_role;
    };
    return role;
};
function levelGiver(score) {
    let level;
    if (score <= config.lvl_m3) {
        level = -3;
    } 
    else if ((score <= config.lvl_m2) && (score > config.lvl_m3)) {
        level = -2;
    } 
    else if ((score <= config.lvl_m1) && (score > config.lvl_m2)) {
        level = -1;
    } 
    else if ((score > config.lvl_m1) && (score < config.lvl_1)) {
        level = 0;
    } 
    else if ((score >= config.lvl_1) && (score < config.lvl_2)) {
        level = 1;
    }
    else if ((score >= config.lvl_2) && (score < config.lvl_3)) {
        level = 2;
    }
    else if ((score >= config.lvl_3) && (score < config.lvl_4)) {
        level = 3;
    }
    else if ((score >= config.lvl_4) && (score < config.lvl_5)) {
        level = 4;
    }
    else if (score >= config.lvl_5) {
        level = 5;
    } return level;
};
//#endregion
client.on('guildMemberAdd', member => {
    let db = new sqlite.Database('./LeaderBotDB.db', sqlite.OPEN_READWRITE);
    let insertdata = db.prepare(`INSERT INTO scoreData VALUES(?,?,?,?)`);
    insertdata.run(member.user.id, member.user.tag, 0, 0);
    insertdata.finalize();
    db.close();
    member.roles.add(config.lvl_0_role);
    console.log("New member joined!");
    return;
})


client.on("message", function(message) {    //Application to event
    if (message.author.equals(client.user)) return;
    
    let authorId = message.author.id;
    if (message.content === config.prefix + "apply") {
        message.delete();
        console.log(" + Apply begin for User: " + message.author.tag + "(" + authorId + ")");
        // User is not already in a registration process    
        if (!(authorId in userApplications)) {
            userApplications[authorId] = { "step" : 1}
  
            let el = new sqlite.Database('./eventMemberList.db', sqlite.OPEN_READWRITE);
            el.get(`SELECT * FROM eventMemberList WHERE userid = ?`, [authorId], (err,row) => {
                if (err) {
                    console.log(err);
                    return;
                };
                if (row === undefined) {
                    let insertdata = el.prepare(`INSERT INTO eventMemberList VALUES(?,?,?,?,?,?)`);
                    insertdata.run(authorId, message.author.tag, " ", " ", " ", " ");
                    insertdata.finalize();
                    el.close();
                    return;
                };
            });
            message.author.send("```css\n\"Application For Event Started - Type '#Cancel' to cancel the application\"\n```");
            message.author.send("```css\n[Question 1: What is your name?]\n```");
        }
    } else {
  
        if (message.channel.type === "dm" && authorId in userApplications) {
            let authorApplication = userApplications[authorId];
  
            if ((message.content === "#Cancel") || (message.content === config.prefix + "apply")) {
                authorApplication.step = 5;
            };
            if (authorApplication.step == 1 ) {
                message.author.send("```css\n[Question 2: What is your surname]\n```");
                let el = new sqlite.Database('./eventMemberList.db', sqlite.OPEN_READWRITE);
                el.run(`UPDATE eventMemberList SET name = ? WHERE userid = ?`, [message.content, authorId]);
                authorApplication.step ++;
            }
            else if (authorApplication.step == 2) {
                message.author.send("```css\n[Question 3: What is your interest?]\n```");
                let el = new sqlite.Database('./eventMemberList.db', sqlite.OPEN_READWRITE);
                el.run(`UPDATE eventMemberList SET surname = ? WHERE userid = ?`, [message.content, authorId]);
                authorApplication.step ++;
            }
            else if (authorApplication.step == 3) {
                message.author.send("```css\n[Question 4: In what event you want participate?]\n```");
                let el = new sqlite.Database('./eventMemberList.db', sqlite.OPEN_READWRITE);
                el.run(`UPDATE eventMemberList SET interest = ? WHERE userid = ?`, [message.content, authorId]);
                authorApplication.step ++;
            }
            else if (authorApplication.step == 4) {
                let el = new sqlite.Database('./eventMemberList.db', sqlite.OPEN_READWRITE);
                el.run(`UPDATE eventMemberList SET event = ? WHERE userid = ?`, [message.content, authorId]);
                message.author.send("```bash\n\"Thanks for your registration. Type !apply to register again.\"\n```");
                console.log(" - Apply ended for User: " + message.author.tag + "(" + authorId + ")");
                delete userApplications[authorId];
            }
            else if (authorApplication.step == 5) {
                message.author.send("```diff\n- You canceled your application. Changed your mind? Try !apply again.\n```");
                let el = new sqlite.Database('./eventMemberList.db', sqlite.OPEN_READWRITE);
                el.run(`DELETE FROM eventMemberList WHERE userid = ?`, [authorId]);
                console.log(" - Apply ended for User: " + message.author.tag + "(" + authorId + ")");
                delete userApplications[authorId];
            }
        }
    }
  });

client.on('message', message => { 
    
//#region "Discord Commands"
    if (message.guild) {
//#region Getting top server member leaderboard

    if  ((message.content.startsWith(config.prefix + "leaderboard")) && (config.usedChannels.includes(message.channel.id))) {
        let db = new sqlite.Database('./LeaderBotDB.db', sqlite.OPEN_READWRITE);
        let sql = `SELECT username, score
                  FROM scoreData 
                  ORDER BY score DESC LIMIT 10`;
        const top10Embed = new Discord.MessageEmbed()
            .setColor("#ffff00")
            .setTitle("**Top 10 score in this server**")
            .setAuthor(client.user.username, client.user.avatarURL())
            .setThumbnail("https://i.imgur.com/p7k5ky4.png")
            .addField("\u200B","\u200B");
        let i = 1;
        db.all(sql, [], (err, rows) => {
            if (err) {
                throw err;
            }
            rows.forEach((rows) => {
                function isEven() {
                    if (i%2 === 0) {
                        return "🔸"
                    } else {
                        return "🔹"
                    }
                };
                function placeIcon() {
                    switch(i) {
                        case 1:
                            return "🥇";
                        case 2:
                            return "🥈";
                        case 3:
                            return "🥉";
                        case 4:
                            return "4️⃣";
                        case 5:
                            return "5️⃣";
                        case 6:
                            return "6️⃣";
                        case 7:
                            return "7️⃣";
                        case 8:
                            return "8️⃣";
                        case 9:
                            return "9️⃣";
                        case 10:
                            return "🔟";
                        default:
                            return "#️⃣";
                    }
                };
                top10Embed.addField("_>>>>>>  _**" + placeIcon() + "_  <<<<<<_**\n" + isEven() + " " + rows.username, "`Score: " + rows.score + "`");
                i++; 
            });
            message.channel.send(top10Embed);
            i = 1;
        });
        db.close();
        message.delete();
    };
    //#endregion
    
//#region Getting member score
    if ((message.content.startsWith(config.prefix + "score")) && (config.usedChannels.includes(message.channel.id))) {
        let db = new sqlite.Database('./LeaderBotDB.db', sqlite.OPEN_READWRITE);
        let query = `SELECT * FROM scoreData WHERE userid = ?`;
        let member; let roleMember;
        if ((message.member.roles.cache.some(r=>config.managementRoleIDs.includes(r.id))) && ((message.mentions.users.first()))) {
            member = message.mentions.users.first();
            roleMember = message.mentions.members.first();
        } else {
            member = message.author;
            roleMember = message.member;
        };
        db.get(query, [member.id], (err,row) => {
            if (err) {
                console.log(err);
                return;
            };
            if (row === undefined) {
                let insertdata = db.prepare(`INSERT INTO scoreData VALUES(?,?,?,?)`);
                insertdata.run(member.id, member.tag, 0, 0);
                insertdata.finalize();
                db.close();
                message.delete();
                roleMember.roles.add(config.lvl_0_role);
                console.log("SYSTEM | New member added to DB");
                dbSetData(member.id, 1, 0);
                return;
            } else {
                let score = row.score;
                message.delete();
                if ((message.member.roles.cache.some(r=>config.managementRoleIDs.includes(r.id))) && ((message.mentions.users.first()))) {
                    if (config.privateMode === 0) {
                        message.channel.send(message.content.slice(7) + " score: " + score);
                    } else if (config.privateMode === 1) {
                        message.author.send(message.content.slice(7) + " score: " + score);
                    }
                } else {
                    if (config.privateMode === 0) {
                        message.channel.send("<@" + message.author.id + "> score: " + score);
                    } else if (config.privateMode === 1) {
                        message.author.send("Your score: " + score);
                    }
                }  
                //#region Role check
                if (message.member.roles.cache.has(roleGiver(score))) {
                    console.log("Role not added!");
                    return;
                }
                else {
                    message.member.roles.add(roleGiver(score)).catch(console.error);
                    console.log("Role added!");
                };
                if (message.member.roles.cache.has(roleRemoverPlus(score))) {
                    message.member.roles.remove(roleRemoverPlus(score)).catch(console.error);
                    console.log("Role removed!");
                }
                else {
                    console.log("Role not removed!: " + roleRemoverPlus(score));
                    return;
                };
                //#endregion 
            };
        });
    } else if ((message.content.startsWith(config.prefix + "score")) && (message.member.roles.cache.some(r=>config.managementRoleIDs.includes(r.id)))) {
        message.delete();
    };
    //#endregion

//#region Setting upvote to member - adding point
    if ((message.content.startsWith(config.prefix + "upvote")) && (message.member.roles.cache.some(r=>config.managementRoleIDs.includes(r.id))) && (message.mentions.users.first()) && (config.usedChannels.includes(message.channel.id))) {
        if (message.mentions.users.first()) {
            let member = message.mentions.users.first();
            
            let db = new sqlite.Database('./LeaderBotDB.db', sqlite.OPEN_READWRITE);
            let query = `SELECT * FROM scoreData WHERE userid = ?`;
            db.get(query, [member.id], (err,row) => {
                if (err) {
                    console.log(err);
                    return;
                };
                if (row === undefined) {
                    let insertdata = db.prepare(`INSERT INTO scoreData VALUES(?,?,?,?)`);
                    insertdata.run(member.id, member.tag, 0, 0);
                    insertdata.finalize();
                    db.close();
                    message.delete();
                    message.mentions.members.first().roles.add(config.lvl_0_role);
                    console.log("SYSTEM | New member added to DB");
                    dbSetData(member.id, 1, 0);
                    return;
                } else {
                    let score = row.score;
                    score++;
                    //data write in DB
                    dbSetData(member.id, score, levelGiver(score));   
                    message.delete();

                    if ((message.content.length > (8 + 4 + member.id.length)) && (config.sendVoteDM === 1)) {
                        member.send("You got point from " + "<@" + message.author.id + ">" + " for" + "**" + message.content.slice(8 + 4 + member.id.length) + "**");
                    } else if ((message.content.length > (8 + 4 + member.id.length)) && (config.sendVoteDM === 0)) {
                        return;
                    };
                    
                    //#region Role check
                    if (message.member.roles.cache.has(roleGiver(score))) {
                        console.log("Role not added!");
                        return;
                    }
                    else {
                        message.member.roles.add(roleGiver(score)).catch(console.error);
                        console.log("Role added!");
                    };
                    if (message.member.roles.cache.has(roleRemoverPlus(score))) {
                        message.member.roles.remove(roleRemoverPlus(score)).catch(console.error);
                        console.log("Role removed!");
                    }
                    else {
                        console.log("Role not removed!: " + roleRemoverPlus(score));
                        return;
                    };
                    //#endregion
                };
            });
        } else {
            message.delete();
            return
        }
    }
    else if (message.content.startsWith(config.prefix + "upvote")) {
        message.delete();
    };
    //#endregion

//#region Setting downvote to member - removing point
    if ((message.content.startsWith(config.prefix + "downvote")) && (message.member.roles.cache.some(r=>config.managementRoleIDs.includes(r.id))) && (message.mentions.users.first()) && (config.usedChannels.includes(message.channel.id))) {
        if (message.mentions.users.first()) {
            let member = message.mentions.users.first();
            let db = new sqlite.Database('./LeaderBotDB.db', sqlite.OPEN_READWRITE);
            let query = `SELECT * FROM scoreData WHERE userid = ?`;
            db.get(query, [member.id], (err,row) => {
                if (err) {
                    console.log(err);
                    return;
                };
                if (row === undefined) {
                    let insertdata = db.prepare(`INSERT INTO scoreData VALUES(?,?,?,?)`);
                    insertdata.run(member.id, member.tag, 0, 0);
                    insertdata.finalize();
                    db.close();
                    message.delete();
                    message.mentions.members.first().roles.add(config.lvl_0_role);
                    reaction.message.member.roles.add(config.lvl_0_role);
                    console.log("SYSTEM | New member added to DB");
                    dbSetData(member.id, 1, 0);
                    return;
                } else {
                    let score = row.score;
                    score--;
                    dbSetData(member.id, score, levelGiver(score));   
                    message.delete();

                    if ((message.content.length > (10 + 4 + member.id.length)) && (config.sendDM === 1)) {
                        member.send("You lost point from " + "<@" + message.author.id + ">" + " for" + "**" + message.content.slice(10 + 4 + member.id.length) + "**");
                    } else if ((message.content.length > (10 + 4 + member.id.length)) && (config.sendDM === 0)) {
                        return;
                    };

                    //#region Role check
                    if (message.member.roles.cache.has(roleGiver(score))) {
                        console.log("Role not added!");
                        return;
                    }
                    else {
                        message.member.roles.add(roleGiver(score)).catch(console.error);
                        console.log("Role added!");
                    };
                    if (message.member.roles.cache.has(roleRemoverMinus(score))) {
                        message.member.roles.remove(roleRemoverMinus(score)).catch(console.error);
                        console.log("Role removed!");
                    }
                    else {
                        console.log("Role not removed!: " + roleRemoverMinus(score));
                        return;
                    };
                    //#endregion
                };
            });
        } else {
            message.delete();
            return;
        }
    } else if (message.content.startsWith(config.prefix + "downvote")) {
        message.delete();
    };
    //#endregion
    //#endregion

//#region Extra features for best and worst member in chat
    if (config.useExtraEmoji === 1) {
        if ((message.author.bot)) {
            return;
        } else {
            if (message.member.roles.cache.has(config.lvl_m3_role) && (!message.content.startsWith(config.prefix))) {
                message.react("😭");
            };
            if (message.member.roles.cache.has(config.lvl_5_role) && (!message.content.startsWith(config.prefix))) {
                message.react("⭐");
            };
        };
    } else {return;};
    //#endregion

//#region mention detection
    if (message.author.bot) {
        return
    };
    if ((message.mentions.users.first()) && (!message.content.includes("<@!" + config.botID + ">")) && 
        (!message.content.includes("<@" + config.botID + ">")) && (!message.author.bot) && (message.content.length > 4 + message.mentions.users.first().id.length)) {
        if ((message.content.startsWith("<@!" + message.mentions.users.first().id + ">")) || 
            (message.content.startsWith("<@" + message.mentions.users.first().id + ">"))) {   
            message.react('✅')
            .then(() => message.react('❌'));
        }
    }
    else if (message.content.includes("<@!" + config.botID + ">") || message.content.includes("<@" + config.botID + ">") ) {
        message.reply("I am not human!");
    } else {return;}
    } else {return;};
    //#endregion
});

client.on('messageReactionAdd', async (reaction, user) => {
    //Fetching messages
    if (user.bot) {
        return
    } else {
        if (reaction.partial) {
		    try {
			    await reaction.fetch();
		    } catch (error) {
			    console.log('Something went wrong when fetching the message: ', error);
			    return;
		    }
        }
    };
//#region Adding point using reaction
    if ((reaction.emoji.name === "✅") && (reaction.message.guild)) {
        if (user.bot) {
            return;
        };
        let member = reaction.message.mentions.users.first();
        if ((user.id === member.id) && (member)) {
            var checkTag = "<@!" + reaction.message.author.id + '>';
            if (config.useEmbed === 1) {
                const answerEmbed = new Discord.MessageEmbed()
                .setColor("#00bd09")
                .setTitle(reaction.message.content.slice(checkTag.length))
                .setAuthor(reaction.message.author.username + " ===> " + member.username, reaction.message.author.avatarURL());
                reaction.message.channel.send(answerEmbed);
            }
            else if (config.useEmbed === 0) {
                reaction.message.channel.send("_**Suggestion**_");
                reaction.message.channel.send("**<@!" + reaction.message.author.id + ">** | " + reaction.message.content.slice(checkTag.length));
            }
            reaction.message.delete();
            
            let db = new sqlite.Database('./LeaderBotDB.db', sqlite.OPEN_READWRITE);
            let query = `SELECT * FROM scoreData WHERE userid = ?`;
            db.get(query, [member.id], (err,row) => {
                if (err) {
                    console.log(err);
                    return;
                };
                if (row === undefined) {
                    let insertdata = db.prepare(`INSERT INTO scoreData VALUES(?,?,?,?)`);
                    insertdata.run(member.id, member.tag, 0, 0);
                    insertdata.finalize();
                    db.close();
                    reaction.message.member.roles.add(config.lvl_0_role);
                    console.log("SYSTEM | New member added to DB");
                    dbSetData(member.id, 1, 0);
                    return;
                } else {
                    let score = row.score;
                    score++;
                    //data write in DB
                    dbSetData(member.id, score, levelGiver(score));   
                    
                    //Role check
                    if (reaction.message.member.roles.cache.has(roleGiver(score))) {
                        return;
                    }
                    else {
                        reaction.message.member.roles.add(roleGiver(score)).catch(console.error);
                    }
                    if (reaction.message.member.roles.cache.has(roleRemoverPlus(score))) {
                        reaction.message.member.roles.remove(roleRemoverPlus(score)).catch(console.error);
                    }
                    else {return;};
                };
            });
            console.log("Added point to user " + reaction.message.author.tag + " from " + user.tag);
        } else {return;};
    } else {return;};
    //#endregion    

//#region Removing point using reaction
    if ((reaction.emoji.name === "❌") && (reaction.message.guild)) {
        if(user.bot) {
            return;
        };
        let member = reaction.message.mentions.users.first();
        if ((user.id === member.id) && (member)) {
            let member = reaction.message.mentions.users.first();
            
            let db = new sqlite.Database('./LeaderBotDB.db', sqlite.OPEN_READWRITE);
            let query = `SELECT * FROM scoreData WHERE userid = ?`;
            db.get(query, [member.id], (err,row) => {
                if (err) {
                    console.log(err);
                    return;
                };
                if (row === undefined) {
                    let insertdata = db.prepare(`INSERT INTO scoreData VALUES(?,?,?,?)`);
                    insertdata.run(member.id, member.tag, 0, 0);
                    insertdata.finalize();
                    db.close();
                    reaction.message.member.roles.add(config.lvl_0_role);
                    console.log("SYSTEM | New member added to DB");
                    dbSetData(member.id, 1, 0);
                    return;
                } else {
                    let score = row.score;
                    score--;
                    //data write in DB
                    dbSetData(member.id, score, levelGiver(score));   
                    
                    //Role check
                    if (reaction.message.member.roles.cache.has(roleGiver(score))) {
                        return;
                    }
                    else {
                        reaction.message.member.roles.add(roleGiver(score)).catch(console.error);
                    }
                    if (reaction.message.member.roles.cache.has(roleRemoverMinus(score))) {
                        reaction.message.member.roles.remove(roleRemoverMinus(score)).catch(console.error);
                    }
                    else {
                        return;
                    };
                };
            });
            console.log("Removed point to user " + reaction.message.author.tag + " from " + user.tag);
        } else {return;};
    } else {return;};
    //#endregion
});

client.on('messageReactionRemove', async (reaction, user) => {
    //Fetching messages
    if (reaction.partial) {
		try {
			await reaction.fetch();
		} catch (error) {
			console.log('Something went wrong when fetching the message: ', error);
			return;
		}
    }
//#region Restoring point
    if ((reaction.emoji.name === "✅") && (reaction.message.guild)) {
        let member = reaction.message.mentions.users.first();
        if ((user.id === member.id) && (member)) { 
            let db = new sqlite.Database('./LeaderBotDB.db', sqlite.OPEN_READWRITE);
            let query = `SELECT * FROM scoreData WHERE userid = ?`;
            db.get(query, [member.id], (err,row) => {
                if (err) {
                    console.log(err);
                    return;
                };
                if (row === undefined) {
                    let insertdata = db.prepare(`INSERT INTO scoreData VALUES(?,?,?,?)`);
                    insertdata.run(member.id, member.tag, 0, 0);
                    insertdata.finalize();
                    db.close();
                    reaction.message.member.roles.add(config.lvl_0_role);
                    console.log("SYSTEM | New member added to DB");
                    dbSetData(member.id, 1, 0);
                    return;
                } else {
                    let score = row.score;
                    score--;
                    //data write in DB
                    dbSetData(member.id, score, levelGiver(score));   
                
                    //Role check
                    if (reaction.message.member.roles.cache.has(roleGiver(score))) {
                        return;
                    }
                    else {
                        reaction.message.member.roles.add(roleGiver(score)).catch(console.error);
                    }
                    if (reaction.message.member.roles.cache.has(roleRemoverMinus(score))) {
                        reaction.message.member.roles.remove(roleRemoverMinus(score)).catch(console.error);
                    }
                    else {return;};
                };
            });
            console.log("Removed point to user " + reaction.message.author.tag + " from " + user.tag);
        } else {return;};
    } else {return;};
    //#endregion
    
//#region Restoring point
    if ((reaction.emoji.name === "❌") && (reaction.message.guild)) {  
        //Data read form DB
        let member = reaction.message.mentions.users.first();
        if ((user.id === member.id) && (member)) {
            let db = new sqlite.Database('./LeaderBotDB.db', sqlite.OPEN_READWRITE);
            let query = `SELECT * FROM scoreData WHERE userid = ?`;
            db.get(query, [member.id], (err,row) => {
                if (err) {
                    console.log(err);
                    return;
                };
                if (row === undefined) {
                    let insertdata = db.prepare(`INSERT INTO scoreData VALUES(?,?,?,?)`);
                    insertdata.run(member.id, member.tag, 0, 0);
                    insertdata.finalize();
                    db.close();
                    reaction.message.member.roles.add(config.lvl_0_role);
                    console.log("SYSTEM | New member added to DB");
                    dbSetData(member.id, 1, 0);
                    return;
                } else {
                    let score = row.score;
                    score++;
                    //Data write in DB
                    dbSetData(member.id, score, levelGiver(score));   
                
                    //Role check
                    if (reaction.message.member.roles.cache.has(roleGiver(score))) {
                        return;
                    }
                    else {
                        reaction.message.member.roles.add(roleGiver(score)).catch(console.error);
                    }
                    if (reaction.message.member.roles.cache.has(roleRemoverPlus(score))) {
                        reaction.message.member.roles.remove(roleRemoverPlus(score)).catch(console.error);
                    }
                    else {return;};
                };
            });
            console.log("Added point to user " + reaction.message.author.tag + " from " + user.tag);
        } else {return;};
    } else {return;};
    //#endregion
});