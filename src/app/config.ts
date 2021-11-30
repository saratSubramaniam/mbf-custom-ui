export let baseURL = 'https://directline.botframework.com/v3/directline/conversations';
export let socketURL = 'wss://directline.botframework.com/v3/directline/conversations';

export let methodTypes = {
    'GET': 'get',
    'POST': 'post'
};

export let httpOptions: any = {
    'headers': {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
};

export let genericError = "Dot the Bot is currently unavailable, please contact the talent team with any queries at <a href='mailto:talent@10xds.com' target='_blank'>talent@10xds.com</a>";
export let activityError = 'We could not send the message to Dot, please try again.';

export let token = '2KMR7hthpqI.AHp_lJkSPF6QpGZGdJUxi0ZEQTYLQN7wRJZpEgmuKmI';
export let staticChats: any[] = [
    {
        type: 1,
        text: 'Hello, I\'m Dot and I can help you with your compliance related queries',
        displayType: 'text',
        buttons: []
    },
    {
        type: 1,
        text: 'Here’s some examples of questions you might like to ask:',
        displayType: 'button',
        buttons: [],
        buttonType: 'text',
        isFAQ: true
    }
];
