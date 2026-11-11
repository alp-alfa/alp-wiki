/* Deterministic balanced wagon assignment. Each wagon has five seats. */
(function(root) {
  'use strict';
  function assign(players, history) {
    var n=players.length, size=n+6, source=n+4, sink=n+5;
    var edges=Array.from({length:size},function(){return [];});
    function add(a,b,capacity,cost) {
      var x={to:b,capacity:capacity,cost:cost,reverse:edges[b].length};
      var y={to:a,capacity:0,cost:-cost,reverse:edges[a].length};
      edges[a].push(x); edges[b].push(y);
    }
    players.forEach(function(name,i){
      add(source,i,1,0);
      var counts=history[name] || [0,0,0,0];
      for(var w=0;w<4;w++) add(i,n+w,1,counts[w]*100 + ((w-i%4+4)%4));
    });
    for(var w=0;w<4;w++) add(n+w,sink,5,0);
    for(var flow=0;flow<n;flow++) {
      var dist=Array(size).fill(Infinity),prev=Array(size),queue=[source],inQueue=Array(size).fill(false);
      dist[source]=0; inQueue[source]=true;
      for(var q=0;q<queue.length;q++) {
        var v=queue[q]; inQueue[v]=false;
        edges[v].forEach(function(e,ei){
          if(e.capacity && dist[v]+e.cost<dist[e.to]) {
            dist[e.to]=dist[v]+e.cost; prev[e.to]=[v,ei];
            if(!inQueue[e.to]){ queue.push(e.to); inQueue[e.to]=true; }
          }
        });
      }
      if(!prev[sink]) throw new Error('Not enough seats');
      for(var v=sink;v!==source;) {
        var p=prev[v],e=edges[p[0]][p[1]];
        e.capacity--; edges[v][e.reverse].capacity++; v=p[0];
      }
    }
    var wagons=[[],[],[],[]];
    players.forEach(function(name,i){
      var edge=edges[i].find(function(e){return e.to>=n && e.to<n+4 && e.capacity===0;});
      var wagon=edge.to-n; wagons[wagon].push(name);
      if(!history[name])history[name]=[0,0,0,0];
      history[name][wagon]++;
    });
    return wagons;
  }
  root.TrainWagons={assign:assign};
})(typeof module==='object'?module.exports:window);
