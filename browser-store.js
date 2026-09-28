/* Business input stays in this browser; hosting access logs are separate. */
(() => {
  const key = 'eldercare-public-demo-v1';
  const clone = value => JSON.parse(JSON.stringify(value));
  const error = (message, status=400) => Object.assign(new Error(message), {status});
  function safeStorage(name) {
    const fallback = new Map();
    return {
      getItem(k) { try { return window[name].getItem(k); } catch { return fallback.get(k) || null; } },
      setItem(k,v) { try { window[name].setItem(k,String(v)); } catch { fallback.set(k,String(v)); } }
    };
  }
  window.CareSession = safeStorage('sessionStorage');
  window.CarePreferences = safeStorage('localStorage');
  let memory = null, persistent = true, lastGood = null;
  let notice = '';
  function temporary(source) {
    persistent=false;memory=clone(source || lastGood || seed());
    notice='临时内存体验：本次记录不会长期保存，关闭或刷新可能丢失。原存储记录未清除。';
  }
  function read() {
    if(!persistent)return clone(memory);
    let raw;
    try {raw=localStorage.getItem(key);} catch {temporary();return clone(memory);}
    let s;
    if(raw===null){
      s=seed();
      try{localStorage.setItem(key,JSON.stringify(s));}catch{temporary(s);return clone(memory);}
    }else{
      try{s=migrate(JSON.parse(raw));}
      catch(e){throw error('体验记录无法读取：'+(e.message||'内容损坏')+'。可保留原记录进入临时体验，或确认重置本项目。',422);}
      if(s.migrationNotice && JSON.parse(raw).version!==2){
        try{localStorage.setItem(key,JSON.stringify(s));}
        catch{throw error('旧记录尚未迁移：存储写入失败。原记录保留，请使用临时体验或重试。',422);}
      }
    }
    lastGood=clone(s);return s;
  }
  function save(s) {
    if(!persistent){memory=clone(s);lastGood=clone(s);return;}
    try{localStorage.setItem(key,JSON.stringify(s));lastGood=clone(s);}
    catch{throw error('浏览器存储空间不足或禁止写入，本次修改未保存。请重试，或在“我的”开启临时体验。',507);}
  }
  const project=(s,r)=>({...view(s,r),mode:'public-demo',storageAvailable:persistent,storageNotice:notice});
  async function locked(fn) {
    if(navigator.locks?.request)return navigator.locks.request(key,fn);
    // Older webviews still check the latest revision before a synchronous write.
    return fn();
  }
  window.PublicCareAPI = {
    storageKey:key,
    async request(path,options={},token){
      const body=options.body?JSON.parse(options.body):{};
      if(path==='recovery'){
        if(body.mode==='temporary'){temporary();return {message:notice};}
        if(body.mode==='reset'&&body.confirmed===true)return locked(()=>{
          const s=seed();
          if(persistent){
            try{localStorage.setItem(key,JSON.stringify(s));}
            catch{throw error('重置未保存：浏览器禁止写入，请选择临时体验',507);}
          }else memory=s;
          for(const k of ['eldercare-large','eldercare-intro'])try{localStorage.removeItem(k);}catch{}
          for(const k of ['eldercare-token','eldercare-role'])try{sessionStorage.removeItem(k);}catch{}
          lastGood=clone(s);return {message:'已重置本项目演示记录，其他项目未清理'};
        });
        throw error('请明确确认重置，或选择临时体验');
      }
      if(path==='session'){
        if(!ROLES.includes(body.role))throw error('请选择有效体验角色');
        return {token:'public-demo-'+body.role,state:project(read(),body.role)};
      }
      const role=String(token||'').replace(/^public-demo-/,'');
      if(!ROLES.includes(role))throw error('请选择体验身份',401);
      if(path==='state')return project(read(),role);
      if(path==='command')return locked(()=>{
        const s=read(),operation=options.headers?.['Idempotency-Key'];
        if(typeof operation!=='string'||operation.length>120)throw error('缺少操作标识，请刷新重试');
        const signature=JSON.stringify([role,body.action,body.data]);
        const receipt=s.receipts.find(x=>x.id===operation);
        if(receipt){
          if(receipt.signature!==signature)throw error('操作标识重复但内容不同',409);
          return {...receipt.result,state:project(s,role)};
        }
        if(body.expectedRevision!==s.revision||body.expectedStoreId!==s.storeId)throw error('记录已在其他标签页或操作中更新，请关闭表单并重新读取后重试。',409);
        const before=s.revision, storeId=s.storeId;
        const result=command(s,role,body.action,body.data);
        s.receipts.push({id:operation,signature,result});s.receipts=s.receipts.slice(-100);
        const latest=read();
        if(latest.revision!==before||latest.storeId!==storeId)throw error('检测到多标签冲突，本次未保存，请重新读取',409);
        save(s);return {...result,state:project(s,role)};
      });
      throw error('不支持的操作',404);
    }
  };
})();
