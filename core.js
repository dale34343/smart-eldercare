/* Local demo rules. No real identity, payment, diagnosis or external dispatch. */
const ROLES = ['elder', 'family', 'operator'];
const LABELS = { draft:'待本人确认', pending:'待接单', accepted:'已接单', in_progress:'服务中', awaiting_confirmation:'待用户确认', completed:'已完成', closed:'回访归档', cancelled:'已取消', rejected:'已拒单' };
const SCOPES = ['reminderStatus','health','finance','companionship','booking'];
const ROLE_NAMES = {elder:'老人',family:'家属',operator:'运营'};
function fail(message,status=400){throw Object.assign(new Error(message),{status});}
function uid(){return globalThis.crypto?.randomUUID?.() || Date.now()+'-'+Math.random().toString(36).slice(2);}
function day(value=new Date()){return new Date(new Date(value).getTime()+28800000).toISOString().slice(0,10);}
function offset(n){return day(Date.now()+n*86400000);}
function text(v,label,max=150){if(typeof v!=='string'||!v.trim()||v.trim().length>max)fail(label+'不能为空，且不能超过'+max+'字');return v.trim();}
function numeric(v,label,min,max){if(!['number','string'].includes(typeof v)||String(v).trim()==='')fail('请填写'+label);const n=Number(v);if(!Number.isFinite(n)||n<min||n>max)fail(label+'需在'+min+'至'+max+'之间');return n;}
function validDate(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v||'')||day(v+'T12:00:00+08:00')!==v)fail('日期无效');return v;}
function slot(date,time){validDate(date);if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(time||''))fail('时间无效');const ms=Date.parse(date+'T'+time+':00+08:00');if(ms<=Date.now()||date>offset(90))fail('请选择北京时间未来90天内的时段');return ms;}
function cents(v,min=1){const s=String(v);if(!/^\d{1,7}(\.\d{1,2})?$/.test(s))fail('金额须为正数，最多两位小数');const [a,b='']=s.split('.');const n=Number(a)*100+Number(b.padEnd(2,'0'));if(n<min||n>100000000)fail('金额超出范围');return n;}
function baseSeed() {
  return {
    version: 1, revision: 0,
    profile: { name: '林阿姨', age: 72, family: '小林', relationship: '女儿', phone: '', address: '示例社区 · 3栋201室', community: '居家养老体验空间' },
    grants: { health: true, finance: false, companionship: true, booking: true },
    services: [
      { id: 'escort', name: '陪同就医', category: '康养照护', icon: 'stethoscope', price: 12000, unit: '次', duration: '3小时', desc: '出行陪同、院内引导与就诊流程协助。', boundary: '不提供诊疗、代开药或医疗操作。', provider: '示例社区服务站', color: 'green' },
      { id: 'home', name: '居家助洁', category: '生活照料', icon: 'house', price: 6000, unit: '次', duration: '2小时', desc: '日常清洁、房间整理与居家生活协助。', boundary: '不包含高空作业与专业消杀。', provider: '示例社区服务站', color: 'gold' },
      { id: 'meal', name: '助餐配送', category: '生活照料', icon: 'utensils', price: 1800, unit: '份', duration: '按预约时段', desc: '社区助餐需求登记与配送安排。', boundary: '饮食禁忌需主动告知；餐品由承接方确认。', provider: '示例社区服务站', color: 'coral' },
      { id: 'visit', name: '暖心探访', category: '精神陪伴', icon: 'heart-handshake', price: 0, unit: '次', duration: '1小时', desc: '上门交流、日常关怀与生活需求了解。', boundary: '不替代专业心理咨询或紧急救援。', provider: '示例志愿服务站', color: 'blue' }
    ],
    tasks: [
      { id: 'task-1', title: '记录晨间血压', time: '08:00', date: day(), done: false, kind: '健康记录' },
      { id: 'task-2', title: '午后散步', time: '16:30', date: day(), done: false, kind: '日常安排' },
      { id: 'task-3', title: '和家人聊聊天', time: '19:30', date: day(), done: false, kind: '亲情联络' }
    ],
    health: [-6,-5,-4,-3,-2,-1,0].map((n,i) => ({ id: `health-${i}`, date: offset(n), systolic: [126,124,128,123,125,121,124][i], diastolic: [78,77,79,76,78,75,78][i], pulse: [72,74,70,73,71,72,72][i], source: '示例记录' })),
    budget: 250000,
    ledger: [
      { id: 'ledger-1', type: 'expense', category: '日常生活', amount: 3600, date: day(), note: '买菜（示例）' },
      { id: 'ledger-2', type: 'expense', category: '养老服务', amount: 12000, date: offset(-1), note: '陪同就医（示例）' },
      { id: 'ledger-3', type: 'income', category: '养老金', amount: 420000, date: day().slice(0,8)+'01', note: '养老金（示例）' }
    ],
    orders: [{ id: 'order-demo', serviceId: 'escort', serviceName: '陪同就医', price: 12000, date: offset(2), time: '09:00', address: '示例社区 · 3栋201室', note: '陪同复诊，需先与家属确认行程（示例）', status: 'pending', createdBy: 'elder', createdAt: new Date().toISOString(), timeline: [{ label: '已提交预约', actor: '老人', at: new Date().toISOString() }] }],
    activities: [
      { id: 'a-1', name: '邻里茶话会', category: '邻里交流', date: offset(3), time: '14:30', place: '示例社区活动室', capacity: 20, booked: 12, icon: 'coffee', color: 'gold' },
      { id: 'a-2', name: '手机摄影小课堂', category: '兴趣课堂', date: offset(5), time: '09:30', place: '示例社区阅览室', capacity: 12, booked: 7, icon: 'camera', color: 'green' },
      { id: 'a-3', name: '公园慢走时光', category: '邻里交流', date: offset(7), time: '08:30', place: '示例社区公园', capacity: 15, booked: 9, icon: 'footprints', color: 'blue' }
    ],
    enrollments: [], moods: [], messages: [], audit: []
  };
}

function seed(){
  const s=baseSeed();s.version=2;s.storeId=uid();s.receipts=[];s.interests=[];s.tickets=[];
  s.grants={reminderStatus:true,health:false,finance:false,companionship:false,booking:true};
  s.grantTerms=Object.fromEntries(SCOPES.map(k=>[k,{expiresAt:offset(30)+'T23:59:59+08:00',purpose:k==='booking'?'代填预约，待本人确认':'查看约定范围的演示信息'}]));
  s.tasks.push({id:'task-med',title:'按既有安排完成用药提醒（虚构）',date:day(),time:'08:30',done:false,kind:'用药提醒',source:'预置虚构安排，不含药物与剂量'});
  s.tasks.forEach(t=>t.source=t.source||'预置虚构安排');
  s.orders[0].ownerConfirmedAt=s.orders[0].createdAt;
  s.orders[0].timeline[0].label='示例预约已由本人确认';
  return s;
}
function validate(s){
  if(!s||s.version!==2||!Number.isSafeInteger(s.revision)||typeof s.storeId!=='string'||!s.profile||typeof s.profile.name!=='string'||!s.grants||!s.grantTerms)fail('记录结构不完整，请使用恢复入口',422);
  for(const k of ['orders','services','tasks','health','ledger','activities','enrollments','moods','messages','audit','tickets','interests','receipts'])if(!Array.isArray(s[k]))fail('记录结构不完整：'+k,422);
  if(!Number.isSafeInteger(s.budget)||s.budget<=0||s.ledger.some(x=>!Number.isSafeInteger(x.amount)||x.amount<=0||typeof x.date!=='string')||s.orders.some(x=>!LABELS[x.status]||!Array.isArray(x.timeline)||typeof x.serviceName!=='string')||s.health.some(x=>![x.systolic,x.diastolic,x.pulse].every(Number.isFinite)))fail('记录内容无效，请使用恢复入口',422);
  return s;
}
function migrate(s){
  if(s?.version===2)return validate(s);
  if(s?.version!==1)fail('记录版本不兼容；原记录未被清除',422);
  for(const k of ['orders','services','tasks','health','ledger','activities','enrollments','moods','messages','audit'])if(!Array.isArray(s[k]))fail('旧记录内容损坏；原记录未被清除',422);
  s.version=2;s.storeId=uid();s.receipts=[];s.interests=[];s.tickets=[];
  s.grants={reminderStatus:true,health:false,finance:false,companionship:false,booking:false,...s.grants};
  s.grantTerms=Object.fromEntries(SCOPES.map(k=>[k,{expiresAt:offset(30)+'T23:59:59+08:00',purpose:'旧版授权迁移，请本人复核'}]));
  s.orders.forEach(o=>{if(o.status==='awaiting_feedback')o.status='awaiting_confirmation';o.legacy=true;});
  s.migrationNotice='旧记录已保留并迁移；旧授权暂保留30天，请复核。旧订单不补造本人确认记录。';
  return validate(s);
}
function allowed(s,role,k){return role==='elder'||(role==='family'&&s.grants[k]===true&&Date.parse(s.grantTerms[k]?.expiresAt)>Date.now());}
function need(s,role,k){if(!allowed(s,role,k))fail('暂无有效授权，请由老人本人确认范围与期限',403);}
function only(role,want='elder'){if(role!==want)fail(want==='elder'?'这一步须由老人本人操作':'这一步须由运营处理',403);}
function view(s,role){
  if(!ROLES.includes(role))fail('身份无效',403);
  const booking=allowed(s,role,'booking')||role==='operator';
  const actual=Object.fromEntries(SCOPES.map(k=>[k,s.grants[k]===true&&Date.parse(s.grantTerms[k]?.expiresAt)>Date.now()]));
  return JSON.parse(JSON.stringify({
    version:2,revision:s.revision,storeId:s.storeId,role,today:day(),profile:role==='elder'?s.profile:{name:s.profile.name,community:s.profile.community},
    grants:role==='operator'?{}:actual,grantTerms:role==='elder'?s.grantTerms:{},
    services:s.services,tasks:role==='elder'?s.tasks:allowed(s,role,'reminderStatus')?s.tasks.filter(t=>t.kind==='用药提醒').map(t=>({id:t.id,title:'用药提醒完成状态',date:t.date,done:t.done,kind:'仅完成状态'})):null,
    health:allowed(s,role,'health')?s.health:null,budget:allowed(s,role,'finance')?s.budget:null,ledger:allowed(s,role,'finance')?s.ledger:null,
    orders:booking?s.orders:null,activities:s.activities,enrollments:role==='operator'||allowed(s,role,'companionship')?s.enrollments:null,
    moods:role==='elder'?s.moods:null,messages:role==='elder'?s.messages:null,interests:role==='elder'?s.interests:[],
    tickets:role==='operator'||role==='elder'?s.tickets:null,
    audit:s.audit.filter(a=>role==='elder'||a.actor===role).slice(-30).reverse(),migrationNotice:s.migrationNotice||''
  }));
}
function assistantPlan(message){
  let answer='我还没理解您的需要。请选择服务或说明希望参加的活动，也可以提交模拟人工请求。',route='services',draft=null;
  if(/胸痛|呼吸困难|晕倒|急救|自杀|轻生/.test(message)){answer='请立即联系身边的人及当地紧急服务。本演示不会报警、拨号或派遣救援。';route='emergency';}
  else if(/骗|验证码|转账|收益|投资/.test(message)){answer='请先暂停转账，不提供验证码、不共享屏幕；索取验证码或承诺高收益是风险线索，请向可信渠道核实。本提示不能保证无风险。';route='wallet';}
  else if(/约|复诊|陪同|助餐|打扫|探访/.test(message)){
    const serviceId=/复诊|陪同|就医/.test(message)?'escort':/助餐/.test(message)?'meal':/打扫/.test(message)?'home':/探访/.test(message)?'visit':null;
    let date='';
    if(/明天/.test(message))date=offset(1);else if(/后天/.test(message))date=offset(2);
    else if(/周[一二三四五六日天]/.test(message)){const target='日一二三四五六'.indexOf(message.match(/周([一二三四五六日天])/)[1].replace('天','日'));const wd=new Date(day()+'T00:00:00Z').getUTCDay();let n=(target-wd+7)%7;if(!n)n=7;date=offset(n);}
    if(serviceId){draft={serviceId,date};answer='找到目录内服务。'+(date?'候选日期为北京时间 '+date+'，请核对是否符合您的意思。':'还需要选择具体日期。')+'请补充开始时间和虚构地点，核对示例费用后保存草稿，再由本人确认预约。';}
    else answer='您需要陪同就医、居家助洁、助餐配送还是暖心探访？请选择后补全时间与地点。';
  }else if(/药|诊断|治病|血压|提醒/.test(message)){answer='可以查看既有安排和模拟记录；我不能诊断、调整药物或生成治疗方案。';route='health';}
  else if(/钱|账|支出|预算/.test(message)){answer='请在账本核对金额后保存。记账不会转账或扣费。';route='wallet';}
  else if(/孤单|难过|陪伴|活动|聊天|摄影|茶|散步/.test(message)){answer='可以选择摄影、邻里交流或慢走兴趣，查看目录内对应活动，核对后报名。不替代亲情或专业心理服务。';route='together';}
  return {answer,route,draft};
}
function command(s,role,action,data={}){
  if(!ROLES.includes(role))fail('身份无效',403);
  if(!data||typeof data!=='object'||Array.isArray(data))fail('操作参数必须是对象');
  const at=new Date().toISOString(),id=uid();let result={message:'已保存演示记录'};
  const order=()=>{const o=s.orders.find(x=>x.id===data.id);if(!o)fail('预约不存在',404);return o;};
  const mark=(o,label,note)=>o.timeline.push({label,actor:ROLE_NAMES[role],at,note:note||''});
  const details=(ignoreId)=>{
    need(s,role,'booking');const service=s.services.find(x=>x.id===data.serviceId);if(!service)fail('请选择目录中的服务');
    slot(data.date,data.time);
    if(s.orders.some(o=>o.id!==ignoreId&&o.serviceId===service.id&&o.date===data.date&&o.time===data.time&&!['cancelled','rejected','closed'].includes(o.status)))fail('同一时段已有该服务预约，请勿重复提交',409);
    return {serviceId:service.id,serviceName:service.name,price:service.price,date:data.date,time:data.time,address:text(data.address,'虚构服务地点',100),note:data.note?text(data.note,'补充需求',200):''};
  };
  switch(action){
    case 'task.add':only(role);validDate(data.date);if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(data.time||''))fail('时间无效');s.tasks.push({id,title:text(data.title,'安排',40),date:data.date,time:data.time,done:false,kind:'日常安排',source:'本人填写的虚构安排'});break;
    case 'task.toggle':{only(role);const t=s.tasks.find(x=>x.id===data.id);if(!t)fail('安排不存在');if(typeof data.done!=='boolean'||t.done===data.done)fail('状态已变化，请重新读取',409);t.done=data.done;t.completedAt=data.done?at:null;break;}
    case 'health.add':{only(role);const systolic=numeric(data.systolic,'收缩压',30,300),diastolic=numeric(data.diastolic,'舒张压',20,200);if(systolic<=diastolic)fail('请核对读数');validDate(data.date);if(data.date>day())fail('不能记录未来测量');s.health.push({id,date:data.date,systolic,diastolic,pulse:numeric(data.pulse,'脉搏',20,250),source:'手动虚构记录',createdAt:at});break;}
    case 'ledger.add':{only(role);if(data.confirmed!==true)fail('请先确认金额');if(!['income','expense'].includes(data.type))fail('收支类型无效');validDate(data.date);if(data.date>day())fail('不能登记未来收支');s.ledger.push({id,type:data.type,amount:cents(data.amount),category:text(data.category,'分类',20),date:data.date,note:data.note?text(data.note,'备注',200):''});break;}
    case 'ledger.delete':{only(role);const i=s.ledger.findIndex(x=>x.id===data.id);if(i<0)fail('记录不存在');if(s.ledger[i].orderId)fail('订单费用留档不可重复删除入账；需要更正请重置演示');s.ledger.splice(i,1);break;}
    case 'budget.set':only(role);s.budget=cents(data.amount,100);break;
    case 'order.create':{const o={...details(),id,status:'draft',createdBy:role,createdAt:at,timeline:[]};mark(o,'预约草稿，待本人确认');s.orders.unshift(o);result={message:'草稿已保存，待老人本人确认',id};break;}
    case 'order.edit':{need(s,role,'booking');const o=order();if(o.status!=='draft')fail('仅待确认草稿可编辑',409);Object.assign(o,details(o.id));mark(o,'已修改草稿，仍待本人确认');break;}
    case 'order.confirm':{only(role);const o=order();if(o.status!=='draft')fail('当前状态不能确认预约',409);slot(o.date,o.time);if(data.price!==o.price)fail('报价有变化，请重新核对',409);o.status='pending';o.ownerConfirmedAt=at;mark(o,'本人确认时间、地点及示例费用');break;}
    case 'order.transition':{only(role,'operator');const o=order();const next={pending:'accepted',accepted:'in_progress',in_progress:'awaiting_confirmation'}[o.status];if(!next||data.status!==next)fail('当前状态不能执行此操作',409);const note=text(data.note,'处理记录',200);if(next==='accepted')o.assignee=text(data.assignee,'虚构承接人',30);o.status=next;mark(o,LABELS[next],note);break;}
    case 'order.review':{only(role);const o=order();if(o.status!=='awaiting_confirmation')fail('还未进入本人确认环节',409);const rating=numeric(data.rating,'评分',1,5);if(!Number.isInteger(rating))fail('评分须为整数');o.review={rating,note:text(data.note,'确认意见',200),at};o.status='completed';o.completedAt=at;mark(o,'本人确认服务已完成',o.review.note);break;}
    case 'order.archive':{only(role,'operator');const o=order();if(o.status!=='completed')fail('须本人确认完成后才能回访归档',409);o.followup={note:text(data.note,'回访记录',200),at,actor:role};o.status='closed';mark(o,'运营回访归档',o.followup.note);break;}
    case 'order.expense':{only(role);const o=order();if(!['completed','closed'].includes(o.status)||!o.completedAt)fail('须本人确认服务完成后登记实际费用',409);if(data.confirmed!==true)fail('请确认实际发生的费用');if(s.ledger.some(x=>x.orderId===o.id))fail('这笔订单已登记费用，不可重复入账',409);s.ledger.push({id,orderId:o.id,type:'expense',amount:cents(data.amount),category:'养老服务',date:day(),note:o.serviceName+'（已确认的演示实际费用）'});o.expenseRecorded=true;mark(o,'本人确认实际费用入账');break;}
    case 'order.cancel':{only(role);const o=order();if(!['draft','pending','accepted'].includes(o.status))fail('已开始履约，请提交模拟人工请求处理',409);o.status='cancelled';mark(o,'本人取消，无扣费无退款',text(data.note,'取消原因',200));break;}
    case 'order.reject':{only(role,'operator');const o=order();if(o.status!=='pending')fail('当前状态不能拒单',409);o.status='rejected';mark(o,'运营拒单并说明原因',text(data.note,'拒单原因',200));break;}
    case 'order.reschedule':{need(s,role,'booking');const o=order();if(!['pending','accepted','draft'].includes(o.status))fail('当前状态不能改约',409);slot(data.date,data.time);if(s.orders.some(x=>x.id!==o.id&&x.serviceId===o.serviceId&&x.date===data.date&&x.time===data.time&&!['cancelled','rejected','closed'].includes(x.status)))fail('改约时段冲突',409);o.date=data.date;o.time=data.time;o.status='draft';delete o.ownerConfirmedAt;delete o.assignee;mark(o,'改约后重新等待本人确认',text(data.note,'改约原因',200));break;}
    case 'order.unanswered':{only(role,'operator');const o=order();if(o.status!=='pending')fail('仅待接单预约可跟进',409);mark(o,'无人接单：运营跟进',text(data.note,'处理动作与结果',200));break;}
    case 'activity.toggle':{need(s,role,'companionship');const a=s.activities.find(x=>x.id===data.id);if(!a)fail('活动不存在');const index=s.enrollments.indexOf(a.id);if(typeof data.join!=='boolean'||(index>=0)===data.join)fail('报名状态已变化，请重新读取',409);if(data.join){if(Date.parse(a.date+'T'+a.time+':00+08:00')<=Date.now()||a.booked>=a.capacity)fail('活动已结束或名额已满');s.enrollments.push(a.id);}else s.enrollments.splice(index,1);result.message=data.join?'已保存模拟报名':'已取消模拟报名';break;}
    case 'interest.set':only(role);if(!['邻里交流','摄影','慢走'].includes(data.interest))fail('兴趣无效');s.interests=[data.interest];break;
    case 'mood.set':only(role);if(!['开心','平静','有点低落'].includes(data.mood))fail('心情无效');s.moods=s.moods.filter(x=>x.date!==day());s.moods.push({date:day(),mood:data.mood});break;
    case 'grant.set':{only(role);if(!SCOPES.includes(data.scope)||typeof data.enabled!=='boolean')fail('授权参数无效');if(data.enabled){validDate(data.expires);if(data.expires<day()||data.expires>offset(365))fail('请选择一年内的有效授权日期');s.grantTerms[data.scope]={expiresAt:data.expires+'T23:59:59+08:00',purpose:text(data.purpose,'授权用途',100)};}s.grants[data.scope]=data.enabled;result.message=data.enabled?'演示授权已更新':'已撤回授权，相关视图将立即更新';break;}
    case 'profile.set':only(role);s.profile={...s.profile,name:text(data.name,'虚构称呼',15),address:text(data.address,'虚构地址',100)};break;
    case 'assistant.send':{only(role);const question=text(data.message,'消息',300),plan=assistantPlan(question);s.messages.push({id,question,...plan,at});s.messages=s.messages.slice(-30);result={message:'规则辅助回复',...plan};break;}
    case 'ticket.create':{if(!['elder','operator'].includes(role))fail('请切换本人或运营视图',403);s.tickets.unshift({id,kind:data.kind==='device'?'模拟设备事件':'模拟人工请求',note:text(data.note,'需求',200),status:'待运营跟进',owner:'运营',at});result.message='模拟请求已记录，未联系任何真人或机构';break;}
    case 'ticket.resolve':{only(role,'operator');const t=s.tickets.find(x=>x.id===data.id);if(!t||t.status!=='待运营跟进')fail('请求已处理或不存在',409);t.status='已跟进';t.resolution=text(data.note,'处理动作与结果',200);t.resolvedAt=at;break;}
    default:fail('不支持的操作',404);
  }
  s.revision++;s.audit.push({id,actor:role,action,at});s.audit=s.audit.slice(-200);return result;
}
if(typeof module!=='undefined')module.exports={seed,view,command,day,offset,slot,cents,migrate,validate,allowed,assistantPlan,LABELS,ROLES};
