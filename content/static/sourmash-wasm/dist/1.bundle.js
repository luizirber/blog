(window.webpackJsonp=window.webpackJsonp||[]).push([[1],{1:function(n,e,t){"use strict";(function(n){const e=t(26);var r=t(67),o=t(77).FASTQStream,i=t(85),c=t(117),u=t(127);const a=t(137),d=t(41),s=document.querySelector("#drag-container"),l=document.querySelector("#progress-bar"),f=document.querySelector("#download_btn"),p=document.querySelector("#ksize-input"),w=document.querySelector("#scaled-input"),m=document.querySelector("#num-input"),v=document.querySelector("#protein-input"),b=document.querySelector("#track-abundance-input");let g,h=0,S=0;const y=()=>{f.disabled=!0,l.style.transform="translateX(-100%)"},q=()=>s.classList.add("dragging"),k=()=>s.classList.remove("dragging");function L(){return u(function(e,t){return function(n){return">"===n.toString().charAt(0)}(e)?t(null,d.obj(i(),function(){return a.obj(function(e,t,r){n.isBuffer(e)&&(e=e.toString());JSON.parse(e),this.push(JSON.parse(e)),r()},function(){this.push(null)})}())):function(n){return"@"===n.toString().charAt(0)}(e)?t(null,new o):void t(new Error("No parser available"))})}function E(n){k(),n.preventDefault(),y();var t=n.dataTransfer.files[0],o=new r(t);h=t.size,g=t.name,o.reader.onprogress=(n=>{let e=100-(S+=n.loaded)/h*100;l.style.transform=`translateX(${-e}%)`});var i=m.value,d=p.value,s=v.checked,q=w.value,E=b.checked,A=new e.KmerMinHash(i,d,s,42,q,E),j=new L,z=new function(){return u(function(n,e){return function(n){return 31===n[0]&&139===n[1]}(n)?e(null,new c.Unzip):e(null,a())})};switch(j.on("data",function(n){A.add_sequence_js(n.seq)}).on("end",function(n){const e=A.to_json(),t=new window.Blob([e],{type:"application/octet-binary"}),r=window.URL.createObjectURL(t),o=document.createElement("a");o.setAttribute("href",r),o.setAttribute("download",g+".sig"),document.querySelectorAll("#download_btn a").forEach(n=>n.parentNode.removeChild(n)),f.appendChild(o),f.addEventListener("click",()=>{o.click()}),f.disabled=!1,l.style.transform="translateX(0%)"}),t.type){case"application/gzip":o.pipe(new c.Unzip).pipe(j);break;default:o.pipe(z).pipe(j)}}s.addEventListener("dragenter",q),s.addEventListener("dragover",q),s.addEventListener("drop",E),s.addEventListener("dragleave",k)}).call(this,t(9).Buffer)},107:function(n,e){},110:function(n,e){},112:function(n,e){},132:function(n,e){},134:function(n,e){},141:function(n,e){},143:function(n,e){},70:function(n,e){},72:function(n,e){},81:function(n,e){},83:function(n,e){},93:function(n,e){},95:function(n,e){}}]);