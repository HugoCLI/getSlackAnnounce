// const express = require('express')
// const app = express();
const {Webhook} = require('discord-webhook-node');
const request = require('request');
const c = require('colors'); c.enable();
const store = require('data-store')({path: process.cwd() + '/config.json'});

const config = (type, value = null) => {
    if (type && !value) {
         return store.get(type);
    }
    else
    {
        return store.set(type, value);
    }
}

const Slack = {
    "GetToken": "https://slack.com/api/oauth.v2.access",
    "GetConversation": "https://slack.com/api/conversations.history",
    "TargetChannelId": "C043TN0J3RD"
}


const trace = (message) => console.log(c.yellow('[      axios-system ]') + " " + message);
const hook = new Webhook(config('webhook-url'));
const users = config('users');
let savedMessage = config('messages');


const onReadyStart = () => {
    trace('bot is started');

    const CheckingAccessToken = () => {
        if (!config('expires_in')) return console.error('user not authentified');
        if (config('access_token') && config('expires_in') < new Date().getTime()) return GettingChannelMessage();

        let options = {};
        options.url = `${Slack.GetToken}?client_id=${config('client_id')}&grant_type=refresh_token&client_secret=${config('client_secret')}&refresh_token=${config('refresh_token')}`;

        request(options, (error, response, body) => {
              const args = JSON.parse(body);
              config('access_token', args.access_token);
              config('refresh_token', args.refresh_token);
              config('expires_in', new Date().getTime() + (args.expires_in * 60000))
              GettingChannelMessage();
        });


    }

    const GettingChannelMessage = () => {
        if (!config('access_token')) return console.error('user not authentified');

        trace('GettingChannelMessage');
        const options = {
            url: `${Slack.GetConversation}?channel=${Slack.TargetChannelId}`,
            headers: {
                "Authorization": `Bearer ${config('access_token')}`,
            }
        };
        request(options, (error, response, body) => {
            const Result = JSON.parse(body);
            for (const [key, value] of Object.entries(Result))
            {
                for (let i = 0; value && i < value.length; i++)
                {
                    const Element = value[i];
                    if (Element.type === "message" && !Element.subtype)
                    {
                        const messageId = Element.ts;

                        if (!savedMessage.includes(messageId))
                        {
                            savedMessage.push(messageId);
                            config('messages', savedMessage);

                            // Running webhook
                            const display_name = users[Element.user] ? users[Element.user] : Element.user;

                            hook.setUsername(`Slack`);
                            hook.setAvatar("https://a.slack-edge.com/80588/marketing/img/meta/slack_hash_256.png");
                            hook.send(`**${display_name}** a écrit dans tls-annoucement:\n\n ${Element.text}`);

                        }
                    }
                }
            }
            setTimeout(() => CheckingAccessToken(), 15000);
        });

    }
  CheckingAccessToken();
}
onReadyStart();


    /*
app.listen(2016, () => {
    Used only for robot initialization

    app.get('/api/slack', (req, res) => {
        const code = req.query.code;
        if (!code) return res.send('No code');
        res.send(code);

        let options = {
            url: 'https://slack.com/api/oauth.v2.access?client_id=4071953744069.4235671570128&client_secret=313be932cc128ec912478a2cc33fca39&code=' + code + '&redirect_uri=https://holberhelp.hugochilemme.com/api/slack',
        };
        request(options, (error, response, body) => {
            store.set('access_token', args.authed_user.access_token);
            store.set('refresh_token', args.authed_user.refresh_token);
            store.set('expires_in', new Date().getTime() + (args.authed_user.expires_in * 60000));
            CheckingAccessToken();
        });
    })

})
    */
