import{_ as b,r as h,o,c,a as m,b as g,d as I}from"./index-D3DKUJDz.js";const M=["src"],V=["src"],A={__name:"CanvasImg",setup(p){const n=h(null),t=h(null),u=h(!1),f=a=>{const e=a.target.files[0];if(e&&e.type.startsWith("image/")){const l=new FileReader;l.onload=r=>{const s=new Image;s.src=r.target.result,s.onload=()=>{w(s)}},l.readAsDataURL(e)}},w=a=>{const e=t.value.getContext("2d");t.value.width=a.width,t.value.height=a.height,e.drawImage(a,0,0);const l="厉凯伦 复印无效",r=48;e.font=`${r}px Arial`,e.fillStyle="rgba(0, 0, 0, 0.3)",e.textAlign="center",e.textBaseline="middle";const s=-(Math.PI/180)*30,C=e.measureText(l).width,i=Math.sqrt(Math.pow(t.value.width,2)+Math.pow(t.value.height,2)),_=Math.max(C,r)*1.5;e.translate(t.value.width/2,t.value.height/2),e.rotate(s);for(let d=-i/2;d<=i/2;d+=_)for(let v=-i/2;v<=i/2;v+=_)e.fillText(l,d,v);e.rotate(s),e.translate(-t.value.width/2,-t.value.height/2),n.value=t.value.toDataURL("image/png")},x=()=>{u.value=!0},k=()=>{u.value=!1},y=()=>{const a=document.createElement("a");a.href=n.value,a.download="watermarked-image.png",a.click()};return(a,e)=>(o(),c("div",null,[m("input",{type:"file",onChange:f,accept:"image/*"},null,32),m("canvas",{ref_key:"canvas",ref:t,style:{display:"none"}},null,512),n.value?(o(),c("img",{key:0,src:n.value,onClick:x,class:"img"},null,8,M)):g("",!0),n.value?(o(),c("button",{key:1,onClick:y},"下载图片")):g("",!0),u.value?(o(),c("div",{key:2,class:"preview-overlay",onClick:k},[m("img",{src:n.value,class:"preview-image"},null,8,V)])):g("",!0)]))}},B=b(A,[["__scopeId","data-v-58b6baf9"]]),P={class:"about"},R={__name:"AboutView",setup(p){return(n,t)=>(o(),c("div",P,[I(B)]))}};export{R as default};
