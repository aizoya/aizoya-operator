import {createAwsConverse} from '../src/bedrock.js';import {buildServer} from '../src/server.js';
if(process.env.AIZOYA_BEDROCK_TEST_APPROVED!=='true')throw Error('LIVE_TEST_APPROVAL_REQUIRED');
const converse=await createAwsConverse({region:process.env.AWS_REGION,modelId:process.env.AIZOYA_BEDROCK_MODEL});
// Local only; this opt-in flag is not an aggregate dollar budget mechanism.
buildServer({converse,maxModelCalls:6}).listen(8787,'127.0.0.1',()=>console.log('Synthetic Alexa+ demo with Bedrock reader: http://127.0.0.1:8787 (six provider-request cap)'));
