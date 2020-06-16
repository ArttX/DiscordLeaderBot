const Discord = require('discord.js');
const config = require("./config.json");
const sqlite = require('sqlite3').verbose();
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });

client.on('ready', () => {
    console.log("Bot is ready!");
    //Creating database file
    let db = new sqlite.Database('./leaderdb.db', sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE);
    //Creating table
    db.run(`CREATE TABLE IF NOT EXISTS scoreData(userid INTEGER NOT NULL, username TEXT NOT NULL, score INTEGER NOT NULL, level INTEGER NOT NULL)`);
});

client.login(config.token);  //Login in to discord

function dbSetData(authorID, score) {
    let db = new sqlite.Database('./leaderdb.db', sqlite.OPEN_READWRITE);
    db.run(`UPDATE scoreData SET score = ? WHERE userid = ?`, [score, authorID]);
    console.log("Data written to DB: " + score);
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


client.on('message', message => { 
    
    if ((message.content.startsWith(config.prefix + "score")) && ((message.member.roles.cache.has(config.ownerRoleID) || message.member.roles.cache.has(config.senseiRoleID))) && (message.mentions.users.first()) && (config.usedChannels.includes(message.channel.id))) {
        let db = new sqlite.Database('./leaderdb.db', sqlite.OPEN_READWRITE);
        let query = `SELECT * FROM scoreData WHERE userid = ?`;
        let member = message.mentions.users.first();
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
                console.log("SYSTEM | New member added to DB");
                dbSetData(member.id, 1);
                return;
            } else {
                let score = row.score;
                message.delete();
                if (config.privateMode === 0) {
                    message.channel.send(message.content.slice(7) + " score: " + score);
                } else if (config.privateMode === 1) {
                    message.author.send(message.content.slice(7) + " score: " + score);
                };   
            };
        });
    };

    if ((message.content.startsWith(config.prefix + "upvote")) && ((message.member.roles.cache.has(config.ownerRoleID) || message.member.roles.cache.has(config.senseiRoleID))) && (message.mentions.users.first()) && (config.usedChannels.includes(message.channel.id))) {
        if (message.mentions.users.first()) {
            let member = message.mentions.users.first();
            
            let db = new sqlite.Database('./leaderdb.db', sqlite.OPEN_READWRITE);
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
                    console.log("SYSTEM | New member added to DB");
                    dbSetData(member.id, 1);
                    return;
                } else {
                    let score = row.score;
                    score++;
                    //data write in DB
                    dbSetData(member.id, score);   
                    message.delete();
                    
                    //Role check
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
                        console.log("Role not removed!" + roleRemoverPlus(score));
                        return;
                    };
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

    if ((message.content.startsWith(config.prefix + "downvote")) && ((message.member.roles.cache.has(config.ownerRoleID) || message.member.roles.cache.has(config.senseiRoleID))) && (message.mentions.users.first()) && (config.usedChannels.includes(message.channel.id))) {
        if (message.mentions.users.first()) {
            let member = message.mentions.users.first();
            let db = new sqlite.Database('./leaderdb.db', sqlite.OPEN_READWRITE);
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
                    console.log("SYSTEM | New member added to DB");
                    dbSetData(member.id, 1);
                    return;
                } else {
                    let score = row.score;
                    score--;
                    dbSetData(member.id, score);   
                    message.delete();

                    //Role check
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
                        console.log("Role not removed!" + roleRemoverMinus(score));
                        return;
                    };
                };
            });
        } else {
            message.delete();
            return;
        }
    } else if (message.content.startsWith(config.prefix + "downvote")) {
        message.delete();
    };

    //mention detection
    if (message.author.bot) {
        return
    };
    if (config.usedChannels.includes(message.channel.id)) {
        if ((message.mentions.users.first()) && (!message.content.includes("<@!" + config.botID + ">")) && 
            (!message.content.includes("<@" + config.botID + ">")) && (!message.author.bot)) {
            if ((message.content.startsWith("<@!" + message.mentions.users.first().id + ">")) || 
                (message.content.startsWith("<@" + message.mentions.users.first().id + ">"))) {   
                message.react('✅')
                .then(() => message.react('❌'));
            }
        }
        else if (message.content.includes("<@!" + config.botID + ">") || message.content.includes("<@" + config.botID + ">") ) {
            message.reply("I am not human!");
        }
        else {
            return;
        }
    }
    else {
        return;
    }
});

client.on('messageReactionAdd', async (reaction, user) => {
    if (reaction.partial) {
		try {
			await reaction.fetch();
		} catch (error) {
			console.log('Something went wrong when fetching the message: ', error);
			return;
		}
    }
    if ((reaction.emoji.name === "✅") && (config.usedChannels.includes(reaction.message.channel.id))) {
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
                .setAuthor(reaction.message.author.username, reaction.message.author.avatarURL());
                reaction.message.channel.send(answerEmbed);
            }
            else if (config.useEmbed === 0) {
                reaction.message.channel.send("_**Suggestion**_");
                reaction.message.channel.send("**<@!" + reaction.message.author.id + ">** | " + reaction.message.content.slice(checkTag.length));
            }
            reaction.message.delete();
            
            let db = new sqlite.Database('./leaderdb.db', sqlite.OPEN_READWRITE);
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
                    console.log("SYSTEM | New member added to DB");
                    dbSetData(member.id, 1);
                    return;
                } else {
                    let score = row.score;
                    score++;
                    //data write in DB
                    dbSetData(member.id, score);   
                    
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
    };
         
    if ((reaction.emoji.name === "❌") && (config.usedChannels.includes(reaction.message.channel.id))) {
        if(user.bot) {
            return;
        };
        let member = reaction.message.mentions.users.first();
        if ((user.id === member.id) && (member)) {
            let member = reaction.message.mentions.users.first();
            
            let db = new sqlite.Database('./leaderdb.db', sqlite.OPEN_READWRITE);
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
                    console.log("SYSTEM | New member added to DB");
                    dbSetData(member.id, 1);
                    return;
                } else {
                    let score = row.score;
                    score--;
                    //data write in DB
                    dbSetData(member.id, score);   
                    
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
        };
    };
});

client.on('messageReactionRemove', async (reaction, user) => {
	if (reaction.partial) {
		try {
			await reaction.fetch();
		} catch (error) {
			console.log('Something went wrong when fetching the message: ', error);
			return;
		}
    }
    if ((reaction.emoji.name === "✅") && (config.usedChannels.includes(reaction.message.channel.id))) {
        let member = reaction.message.mentions.users.first();
        if ((user.id === member.id) && (member)) { 
            let db = new sqlite.Database('./leaderdb.db', sqlite.OPEN_READWRITE);
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
                    console.log("SYSTEM | New member added to DB");
                    dbSetData(member.id, 1);
                    return;
                } else {
                    let score = row.score;
                    score--;
                    //data write in DB
                    dbSetData(member.id, score);   
                
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
        }
    } else {return;};
    
    if ((reaction.emoji.name === "❌") && (config.usedChannels.includes(reaction.message.channel.id))) {  
        //data read form DB
        let member = reaction.message.mentions.users.first();
        if ((user.id === member.id) && (member)) {
            let db = new sqlite.Database('./leaderdb.db', sqlite.OPEN_READWRITE);
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
                    console.log("SYSTEM | New member added to DB");
                    dbSetData(member.id, 1);
                    return;
                } else {
                    let score = row.score;
                    score++;
                    //data write in DB
                    dbSetData(member.id, score);   
                
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
        };
    };
});