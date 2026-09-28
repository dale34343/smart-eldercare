/* Shared domain rules for the browser service and offline WeChat experience. */
const ROLES = ['elder', 'family', 'operator'];
const LABELS = { pending: '待接单', accepted: '已接单', in_progress: '服务中', awaiting_feedback: '待回访', closed: '已完成', cancelled: '已取消' };
const SCOPES = ['health', 'finance', 'companionship', 'booking'];
function fail(message, status = 400) { const e = new Error(message); e.status = status; throw e; }
function day(date = new Date()) { const d = new Date(date); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function offset(n) { const d = new Date(); d.setDate(d.getDate()+n); return day(d); }
function text(value, label, max = 150) { if (typeof value !== 'string' || !value.trim() || value.trim().length > max) fail(`${label}不能为空，且不能超过${max}字`); return value.trim(); }
function numeric(value, label, min, max) { if (!['number','string'].includes(typeof value) || String(value).trim() === '') fail(`请填写${label}`); const n = Number(value); if (!Number.isFinite(n) || n < min || n > max) fail(`${label}需在${min}至${max}之间`); return n; }
function validDate(value) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '') || day(new Date(value + 'T12:00:00')) !== value) fail('日期无效'); return value; }
function seed() {
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
function allowed(s, role, scope) { return role === 'elder' || (role === 'family' && s.grants[scope] === true); }
function need(s, role, scope) { if (!allowed(s, role, scope)) fail('暂无此项授权，请由老人本人在授权管理中确认', 403); }
function view(s, role) {
  if (!ROLES.includes(role)) fail('身份无效', 403);
  const booking = allowed(s, role, 'booking') || role === 'operator';
  return JSON.parse(JSON.stringify({
    revision: s.revision, role, mode: 'local-demo', today: day(),
    profile: role === 'operator' ? {name: s.profile.name, community:s.profile.community} : s.profile,
    grants: role === 'operator' ? {} : s.grants, services: s.services,
    tasks: allowed(s, role, 'health') ? s.tasks : null,
    health: allowed(s, role, 'health') ? s.health : null,
    budget: allowed(s, role, 'finance') ? s.budget : null,
    ledger: allowed(s, role, 'finance') ? s.ledger : null,
    orders: booking ? s.orders : null,
    activities: s.activities,
    enrollments: allowed(s, role, 'companionship') ? s.enrollments : null,
    moods: allowed(s, role, 'companionship') ? s.moods : null,
    messages: role === 'elder' ? s.messages : null,
    audit: s.audit.filter(a => role === 'elder' || a.actor === role).slice(-30).reverse()
  }));
}
function command(s, role, action, data = {}) {
  if (!ROLES.includes(role)) fail('身份无效',403);
  if (!data || typeof data !== 'object' || Array.isArray(data)) fail('操作参数必须是对象');
  const at = new Date().toISOString();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
  let result = {message:'已保存'};
  switch (action) {
    case 'task.add': {
      need(s,role,'health');
      const time = text(data.time,'时间',5); if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) fail('时间无效');
      s.tasks.push({id,title:text(data.title,'安排',40),date:validDate(data.date),time,done:false,kind:'日常安排'}); break;
    }
    case 'task.toggle': { need(s,role,'health'); const item=s.tasks.find(t=>t.id===data.id); if(!item) fail('找不到这条安排',404); item.done=!item.done; item.completedAt=item.done?at:null; break; }
    case 'health.add': {
      need(s,role,'health'); const sys=numeric(data.systolic,'收缩压',30,300), dia=numeric(data.diastolic,'舒张压',20,200);
      if(sys<=dia) fail('请核对读数：收缩压应高于舒张压');
      const date=validDate(data.date); if(date>day()) fail('健康记录不能填写未来日期');
      s.health.push({id,date,systolic:sys,diastolic:dia,pulse:numeric(data.pulse,'脉搏',20,250),source:'手动记录',createdAt:at}); break;
    }
    case 'ledger.add': {
      need(s,role,'finance'); if(!['income','expense'].includes(data.type)) fail('收支类型无效');
      const date=validDate(data.date); if(date>day()) fail('收支记录不能填写未来日期');
      s.ledger.push({id,type:data.type,amount:Math.round(numeric(data.amount,'金额',0.01,1000000)*100),category:text(data.category,'分类',20),date,note:typeof data.note==='string'?data.note.trim().slice(0,100):''}); break;
    }
    case 'ledger.delete': { need(s,role,'finance'); const i=s.ledger.findIndex(x=>x.id===data.id); if(i<0) fail('记录不存在',404); s.ledger.splice(i,1); break; }
    case 'budget.set': { need(s,role,'finance'); s.budget=Math.round(numeric(data.amount,'月预算',1,1000000)*100); break; }
    case 'order.create': {
      need(s,role,'booking'); const service=s.services.find(x=>x.id===data.serviceId); if(!service) fail('服务不存在');
      const date=validDate(data.date); const time=text(data.time,'预约时间',5);
      if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)||new Date(date+'T'+time)<=new Date()||date>offset(90)) fail('请选择未来90天内的预约时间');
      if(s.orders.some(o=>o.serviceId===service.id&&o.date===date&&o.time===time&&!['cancelled','closed'].includes(o.status))) fail('同一时段已有该服务预约，请勿重复提交');
      const item={id,serviceId:service.id,serviceName:service.name,price:service.price,date,time,address:text(data.address,'服务地点',100),note:String(data.note||'').trim().slice(0,300),status:'pending',createdBy:role,createdAt:at,timeline:[{label:'已提交预约',actor:role==='elder'?'老人':'家属',at}]};
      s.orders.unshift(item); result={message:'预约已登记，等待运营接单',id}; break;
    }
    case 'order.transition': {
      if(role!=='operator') fail('仅运营人员可以处理履约状态',403);
      const order=s.orders.find(x=>x.id===data.id); if(!order) fail('预约不存在',404);
      const next={pending:'accepted',accepted:'in_progress',in_progress:'awaiting_feedback'}[order.status];
      if(data.status!==next||!next) fail('当前状态不能执行此操作',409);
      const note=text(data.note,'处理说明',200);
      const assignee=next==='accepted'?text(data.assignee,'承接人',30):order.assignee;
      order.status=next; order.timeline.push({label:LABELS[next],actor:'运营人员',note,at});
      if(next==='accepted') order.assignee=assignee; break;
    }
    case 'order.cancel': {
      need(s,role,'booking'); const order=s.orders.find(x=>x.id===data.id); if(!order) fail('预约不存在',404);
      if(!['pending','accepted'].includes(order.status)) fail('服务已开始，无法直接取消，请联系运营人员',409);
      order.status='cancelled'; order.timeline.push({label:'已取消预约',actor:role==='elder'?'老人':'家属',at}); break;
    }
    case 'order.review': {
      need(s,role,'booking'); const order=s.orders.find(x=>x.id===data.id); if(!order) fail('预约不存在',404);
      if(order.status!=='awaiting_feedback') fail('当前预约还未进入回访环节',409);
      const rating=numeric(data.rating,'评分',1,5); if(!Number.isInteger(rating)) fail('评分需为整数');
      order.review={rating,note:text(data.note,'回访意见',200),at}; order.status='closed'; order.timeline.push({label:'回访归档',actor:role==='elder'?'老人':'家属',at}); break;
    }
    case 'activity.toggle': {
      need(s,role,'companionship'); const activity=s.activities.find(a=>a.id===data.id); if(!activity) fail('活动不存在');
      const index=s.enrollments.indexOf(data.id); if(index>=0) {s.enrollments.splice(index,1);result.message='已取消报名';}
      else {if(activity.date<day()||activity.booked>=activity.capacity) fail('活动已结束或名额已满'); s.enrollments.push(data.id);result.message='已记录报名（本地体验）';} break;
    }
    case 'mood.set': {
      if(role!=='elder') fail('心情请由老人本人填写',403);
      if(!['开心','平静','有点低落'].includes(data.mood)) fail('心情选项无效');
      s.moods=s.moods.filter(x=>x.date!==day()); s.moods.push({date:day(),mood:data.mood}); break;
    }
    case 'grant.set': {
      if(role!=='elder') fail('仅老人本人可以变更授权',403);
      if(!SCOPES.includes(data.scope)||typeof data.enabled!=='boolean') fail('授权参数无效');
      s.grants[data.scope]=data.enabled; result.message=data.enabled?'已授予家属查看与协助权限':'已撤回授权，家属将无法查看该类信息'; break;
    }
    case 'profile.set': {
      if(role!=='elder') fail('仅老人本人可以修改档案',403);
      const phone=String(data.phone||'').trim(); if(phone&&!/^1[3-9]\d{9}$/.test(phone)) fail('请输入有效的11位家属手机号');
      s.profile={...s.profile,name:text(data.name,'称呼',15),address:text(data.address,'地址',100),phone}; break;
    }
    case 'assistant.send': {
      if(role!=='elder') fail('请在老人视图使用个人服务助手',403);
      const message=text(data.message,'消息',300); let answer='我可以帮您找到预约服务、健康记录、记账和社区活动。您想先办理哪一项？',route='services';
      if(/胸痛|呼吸困难|晕倒|急救|自杀|轻生/.test(message)) {answer='遇到紧急情况，请立即联系身边的人或拨打120。本平台不会自动通知救援人员。';route='emergency';}
      else if(/药|诊断|治病|血压高|血压低/.test(message)) {answer='我不能诊断或调整用药。请联系医务人员；您可以记录测量结果，或预约陪同就医。';route='health';}
      else if(/钱|账|支出|预算/.test(message)) {answer='可以在收支账本登记金额与用途，查看本月预算。记账不会转账或扣费。';route='wallet';}
      else if(/骗|验证码|转账|收益|投资/.test(message)) {answer='请先暂停操作，不提供验证码，不共享屏幕。通过自行核实的官方渠道或可信家属核对；这里不做投资推荐或诈骗认定。';route='wallet';}
      else if(/孤单|难过|伤心|陪伴|活动|聊天/.test(message)) {answer='谢谢您愿意说出来。可以给家人打个电话，也可以看看社区活动，找人聊一聊。';route='together';}
      else if(/健康|血压|提醒|待办/.test(message)) {answer='已为您找到健康记录和今日安排。测量数据请按设备实际读数填写。';route='health';}
      else if(/约|就医|复诊|助餐|打扫|上门/.test(message)) {answer='请从服务目录选择需要的服务，再确认时间、地点和费用后提交。没有您的确认，不会创建预约。';route='services';}
      s.messages.push({id,question:message,answer,route,at}); s.messages=s.messages.slice(-30); result={message:'已回复',answer,route}; break;
    }
    default: fail('不支持的操作',404);
  }
  s.revision++;
  s.audit.push({id,actor:role,action,at}); s.audit=s.audit.slice(-200);
  return result;
}
if(typeof module!=='undefined') module.exports={seed,view,command,day,offset,LABELS,ROLES};
