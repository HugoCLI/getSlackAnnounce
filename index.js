const express = require('express')
const app = express();

const c = require('colors');
c.enable();
const store = require('data-store')({path: process.cwd() + '/config.json'});

const {Webhook} = require('discord-webhook-node');
const hook = new Webhook(store.get('webhook-url'));

const request = require('request');

const users = store.get('users');
let savedMessage = store.get('messages');



app.listen(2016, () => {
    console.log('BotIsOnline')

    const CheckingAccessToken = () => {
        if (!store.get('expires_in')) return console.error('user not authentified');
        if (store.get('expires_in') > new Date().getTime()) return GettingChannelMessage();

        console.log('CheckingAccessToken');
        const options = {
            url: 'https://slack.com/api/oauth.v2.access?client_id=4071953744069.4235671570128&grant_type=refresh_token&client_secret='+store.get('client_secret') +'&refresh_token=' + store.get('refresh_token'),
        };
        request(options, (error, response, body) => {
            const args = JSON.parse(body);
            store.set('access_token', args.access_token);
            store.set('refresh_token', args.refresh_token);
            store.set('expires_in', new Date().getTime() + (args.expires_in * 60000))
            return GettingChannelMessage();
        });


    }

    const GettingChannelMessage = () => {
        if (!store.get('access_token')) return console.error('user not authentified');

        console.log('GettingChannelMessage');
        const options = {
            url: ' https://slack.com/api/conversations.history?channel=C043TN0J3RD',
            headers: {
                "Authorization": `Bearer ${store.get('access_token')}`,
            }
        };
        request(options, (error, response, body) => {
            let data = JSON.parse(body);
            for (const [key, value] of Object.entries(data))
            {
                for (let i = 0; value && i < value.length; i++)
                {
                    const element = value[i];
                    if (element.type === "message" && !element.subtype)
                    {
                        const messageId = element.ts;
                        if (!savedMessage.includes(messageId))
                        {
                            savedMessage.push(messageId);
                            store.set('messages', savedMessage);

                            // Running webhook
                            const display_name = users[element.user] ? users[element.user] : element.user;

                            hook.setUsername(`Slack`);
                            hook.setAvatar("https://a.slack-edge.com/80588/marketing/img/meta/slack_hash_256.png");
                            hook.send(`**${display_name}** a écrit dans tls-annoucement:\n\n ${element.text}`);

                        }
                    }
                }
            }
            setTimeout(() => CheckingAccessToken(), 15000);
        });

    }
    CheckingAccessToken();







    /*
    Used only for robot initialization

    app.get('/api/slack', (req, res) => {
        const code = req.query.code;
        if (!code) return res.send('No code');
        res.send(code);

        let options = {
            url: 'https://slack.com/api/oauth.v2.access?client_id=4071953744069.4235671570128&client_secret=313be932cc128ec912478a2cc33fca39&code=' + code + '&redirect_uri=https://holberhelp.hugochilemme.com/api/slack',
        };
        request(options, (error, response, body) => {
            const args = JSON.parse(body);
            store.set('access_token', args.authed_user.access_token);
            store.set('refresh_token', args.authed_user.refresh_token);
            store.set('expires_in', new Date().getTime() + (args.authed_user.expires_in * 60000));
            CheckingAccessToken();
        });
    })
    */
})


const trace = (message) => console.log(c.yellow('[      axios-system ]') + " " + message);