// /*
// *  既是长度 也是个数
// *  移动位数 = 已匹配的字符数 - 对应的部分匹配值
// * */
// const t  = 'ABCDABD'
// const s ='BBC ABCDAB ABCDABCDABDE'
function kmp(arr,t) {
  for (let i=1;i<t.length;i++){
    let self = t.slice(0,i)
    //
    let matching = 0
    let proArr = getProArr([],self)
    let nextArr = geNextArr([],self)
    let intersection = proArr.filter(v => nextArr.includes(v)) // [2]
    let offset = intersection.length>0?intersection[intersection.length-1].length:0
    arr.push(offset)
  }
  return arr
}
function geNextArr(arr, str) {
  for (let i=1;i<str.length;i++){
   arr.push(str.slice(i))
  }
  return arr
}
function getProArr(arr, str) {
  for (let i=1;i<str.length;i++){
    arr.push(str.slice(0,i))
  }
  return arr
}
const t = 'ABCDABD'
const maxMatchedNum = t.length - 1
let matchedNum = 0
let matchedNumArr = kmp([],t)
function match(string) {
  let state = start;
 for (let index = 0;index<string.length;index++){
    state = state(string.charAt(index),index,string)
 }
  return state === end

}
function start(c,index,self) {
  matchedNum = 0
  // console.log(`从${c}开始匹配`)
  if (c === t[0]){
    matchedNum++
    index = (index+1)
    return next(index,self)
  }else{
    return start
  }
}
function next(index,self) {
  console.log(index,self[index],t[matchedNum])
  if (index === self.length){
    return end
  }
  if ((self[index] === t[matchedNum])&& matchedNum < maxMatchedNum){
    matchedNum++
    return next(index+1,self)
  }else if ((self[index] === t[matchedNum])&& matchedNum === maxMatchedNum){
    console.log('yes')
    return end
  }else{
    let offset = matchedNum - matchedNumArr[matchedNum-1]
    // 在这个匹配不上的地方 c需要回退 下标也需要回退
    console.log('回退',matchedNum,matchedNumArr[matchedNum-1],offset,self[index-(matchedNum-offset)])
    return start(self[index-(matchedNum-offset)],index-(matchedNum-offset),self)
  }
}
function end(c) {
  return end
}
match('BBC ABCDAB ABCDABCDABDE')
// BCDAB ABCDABCDABDE
