import {isActiveTelegram,mayReceiveTelegram,markTelegramOpened} from './telegrams.js';
const MODULE='campaign-wiki', REQUEST='telegramOpenRequest', REPLY='telegramOpenReply';
let adapter, queue=Promise.resolve();
const pending=new Map(), opening=new Map();
const users=()=>Array.from(game.users??[]);
const authority=()=>users().filter(u=>u.isGM&&u.active).sort((a,b)=>a.id.localeCompare(b.id))[0];
export function installTelegramDelivery(options) {
  adapter=options;
  Hooks.on('updateUser',(user,changes,_options,initiatorId)=>{
    if(["character","name","role","active"].some(key=>Object.hasOwn(changes,key)))options.refresh();
    const reply=changes.flags?.[MODULE]?.[REPLY];
    if(user.id===game.user.id&&reply&&game.users.get(initiatorId)?.isGM) pending.get(reply.nonce)?.(reply);
    const request=changes.flags?.[MODULE]?.[REQUEST];
    // updateUser supplies the authenticated initiating user; never trust a payload user ID.
    if(!request||user.id!==initiatorId||authority()?.id!==game.user.id)return;
    queue=queue.then(async()=>{
      const requester=game.users.get(initiatorId),data=options.getDatabase(),article=data.articles[request.articleId];
      let ok=false;
      try{
        if(requester&&mayReceiveTelegram(data,article,requester,users())){
          if(markTelegramOpened(data,request.articleId,requester,users()))await options.persist(data);
          ok=data.articles[request.articleId]?.currentStatus==='inactive';
        }
      }catch(error){console.error('Campaign Wiki telegram delivery failed',error);}
      await user.setFlag(MODULE,REPLY,{nonce:request.nonce,ok});
    }).catch(error=>console.error('Campaign Wiki telegram reply failed',error));
  });
}
export function requestTelegramOpen(articleId) {
  if(opening.has(articleId))return opening.get(articleId);
  const task=sendOpenRequest(articleId).finally(()=>opening.delete(articleId));
  opening.set(articleId,task);return task;
}
function sendOpenRequest(articleId) {
  if(!adapter)return Promise.reject(new Error('Telegram delivery is not ready.'));
  const data=adapter.getDatabase(),article=data.articles[articleId];
  if(game.user.isGM)return Promise.resolve();
  if(!article)return Promise.reject(new Error('Article unavailable.'));
  if(!isActiveTelegram(data,article))return Promise.resolve();
  if(!mayReceiveTelegram(data,article,game.user,users()))return Promise.reject(new Error('Article unavailable.'));
  if(!authority())return Promise.reject(new Error('A Game Master must be connected to deliver this telegram. It remains unread.'));
  const nonce=foundry.utils.randomID();
  return new Promise((resolve,reject)=>{
    const finish=(error)=>{
      clearTimeout(timer);pending.delete(nonce);
      if(error)reject(error);else resolve();
    };
    const timer=setTimeout(()=>finish(new Error('Telegram delivery could not be confirmed. Please try opening it again.')),12000);
    pending.set(nonce,reply=>finish(reply.ok?null:new Error('Article unavailable.')));
    game.user.setFlag(MODULE,REQUEST,{articleId,nonce}).catch(finish);
  });
}
