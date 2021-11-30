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

export let genericError = "Glyn is currently unavailable, please contact the support team with any queries at <a href='mailto:support@10xds.com' target='_blank'>support@10xds.com</a>";
export let activityError = "We couldn't send the message to Glyn, please try again.";

export let token = '2KMR7hthpqI.AHp_lJkSPF6QpGZGdJUxi0ZEQTYLQN7wRJZpEgmuKmI';