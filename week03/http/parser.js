/*
*
*
* */
const css = require("css");
let currentToKen = null;
let currentAttribute = null;
let stack = [{ type: "document", children: [] }];
let currentTextNode = null
/* css */
let rules = []
function specifictity(selecotr) {
  var p = [0,0,0,0]
  var selectorParts = selecotr.split(' ')
  for (var part of selectorParts){
    if (part.charAt(0) === '#'){
      p[1] += 1
    }else if (part.charAt(0) === '.'){
      p[2] += 1
    }else{
      if (part.split("#").length === 2){
        p[1] += 1
      }
      p[3] += 1
    }
  }
  return p
}
function compare(sp1,sp2) {
  if (sp1[0]-sp2[0]){
    return sp1[0]-sp2[0]
  }else if ( sp1[1]-sp2[1]){
    return  sp1[1]-sp2[1]
  }else if ( sp1[2]-sp2[2]){
    return  sp1[2]-sp2[2]
  }else {
    return  sp1[3]-sp2[3]
  }
}
function addCSSRules(text) {
  var ast = css.parse(text);
  // console.log(JSON.stringify(ast, null, "  "));
  rules.push(...ast.stylesheet.rules);
}
function match(element, selector) {
  if (!selector || !element.attributes) return false;

  if (selector.charAt(0) === "#") {
    var attr = element.attributes.filter((attr) => attr.name === "id")[0];
    if (attr && attr.value === selector.replace("#", "")) return true;
  } else if (selector.charAt(0) === ".") {
    var attr = element.attributes.filter((attr) => attr.name === "class")[0];
    if (attr && attr.value === selector.replace(".", "")) return true;
  } else {
    if (selector.split("#").length === 2){
      var attr = element.attributes.filter((attr) => attr.name === "id")[0];
      if (attr && attr.value === selector.split('#')[1] && element.tagName === selector.split('#')[0] ) {
        console.log('会有奇迹发送')
        return true;
      }
    }else{
      if (element.tagName === selector) return true;
    }

  }
  return false;
}
function computeCSS(element) {
  var elements = stack.slice().reverse()
  if (!element.computedStyle){
    element.computedStyle = {}
  }
  for (let rule of rules){
    var selectorParts = rule.selectors[0].split(" ").reverse();
    if (!match(element, selectorParts[0])) continue;
    let matched = false
    var j = 1
    for (var i=0;i<elements.length;i++){
      if (match(elements[i],selectorParts[j])){
        j++
      }
    }
    if (j >= selectorParts.length){
      matched = true
    }

    if (matched){
      var sp = specifictity(rule.selectors[0])
      var computedStyle = element.computedStyle
      for (var declaration of rule.declarations){
        if (!computedStyle[declaration.property]){
          computedStyle[declaration.property] = {}
        }
        // computedStyle[declaration.property] = declaration.value
        if (!computedStyle[declaration.property].specificity){
           computedStyle[declaration.property].value = declaration.value
             computedStyle[declaration.property].specificity = sp
        }else if (compare(computedStyle[declaration.property].specificity,sp)<0){
          computedStyle[declaration.property].value = declaration.value
          computedStyle[declaration.property].specificity = sp
        }
      }
    }
  }
  // let inlineStyle = element.attributes.filter(p=>p.name === 'style')
  // css.parse("*{" + inlineStyle + "}")
  // sp = [1,0,0,0]

}


function emit(token) {
  console.log(stack ,'好看吗')
  let top = stack[stack.length - 1];
  if (token.type === 'startTag'){
    let element = {
      type: "element",
      children: [],
      attributes: [],
    };
    element.tagName = token.tagName
    for (let p in token){
      if (p !== 'type' && p !== 'tagName'){
        element.attributes.push({
            name: p,
            value: token[p]
          })
      }
    }
    computeCSS(element);

    // 这个地方有个相互引用的问题 拷贝一份未添加element的top
    element.parent = JSON.parse(JSON.stringify(top));
    top.children.push(element);

    if (!token.isSelfClosing){
      stack.push(element)
    }
    currentTextNode = null
  }else if (token.type === 'endTag'){
    if (top.tagName != token.tagName) {
      throw new Error('cuo!')
    }else {
      if (top.tagName === 'style'){
        addCSSRules(top.children[0].content)
      }
      stack.pop()
    }
    currentTextNode = null
  }else if (token.type === 'text'){
    if (currentTextNode === null){
      currentTextNode = {
        type:'text',
        content:''
      }
      top.children.push(currentTextNode)
    }
    currentTextNode.content += token.content
  }
}
const EDF = Symbol('EDF')
function data(c) {
  if (c === '<'){
    return tagOpen
  }else if(c === EDF){
    emit({
      type:'EDF'
    })
    return
  }else{
    emit({
      type : 'text',
      content : c
    })
    return data
  }
}
/*
* 标签开始
* */
function tagOpen(c) {
  if (c === '/'){
    return endTagOpen
  }else if (c.match(/^[a-zA-Z]$/)){
    // 进入这里 既可确认是开始标签或者自封闭标签
    // type 都为startTag  如果是自封闭标签 增加新字段是是自封闭标签
    currentToKen =  {
      type:'startTag',
      tagName:''
    }
    return tagName(c)
  }else{
    return ;
  }

}

function endTagOpen(c) {
  if (c.match(/^[a-zA-Z]$/)){
    currentToKen = {
      type:'endTag',
      tagName:''
    }
    return tagName(c)
  }else if (c === '>'){

  }else if (c === EDF){

  }else{

  }
}
// <html props
// >html/> 自封闭标签
function tagName(c) {
  if (c.match(/^[\t\n\f ]$/)) {
    return beforeAttributeName;
  } else if (c === "/") {
    return selfClosingStartTag;
  } else if (c.match(/^[a-zA-Z]$/)) {
    currentToKen.tagName += c;
    return tagName;
  } else if (c === ">") {
    emit(currentToKen);
    return data;
  } else {
    return tagName;
  }
}
function attributeName(c) {
  if (c.match(/^[\t\n\f ]$/) || c === '/' || c === '>' || c ===EDF){
    return afterAttributeName
  }else if (c === '='){
    return beforeAttributeValue
  }else if (c === '\u0000'){

  }else if (c === '\"' || c ==='"' || c === "<"){

  }else{
    currentAttribute.name += c
    return attributeName
  }

}
function afterAttributeName(c) {
  if (c.match(/^[\t\n\f ]$/)) {
    return afterAttributeName;
  } else if (c === "/") {
    return selfClosingStartTag;
  } else if (c === "=") {
    return beforeAttributeValue;
  } else if (c === ">") {
    currentToKen[currentAttribute.name] = currentAttribute.value;
    emit(currentToKen);
    return data;
  } else if (c === EOF) {
  } else {
    currentToKen[currentAttribute.name] = currentAttribute.value;
    currentAttribute = {
      name: "",
      value: "",
    };
    return attributeName(c);
  }
}
function beforeAttributeName(c){
  if (c.match(/^[\t\n\f ]$/)){
    return beforeAttributeName
  }else if (c === '>'|| c === '/'|| c === EDF){
    return afterAttributeName(c)
  }else if (c === '='){

  }else {
    currentAttribute = {
      name:'',
      value:''
    }
    return attributeName(c)
  }
}
function beforeAttributeValue(c){
  if (c.match(/^[\t\n\f ]$/) || c === '/' || c === '>' || c ===EDF){
    return beforeAttributeValue
  }else if (c === '\"'){
    return doubleQuotedAttributeValue
  }else if (c === "\'"){
    return singleQuotedAttributeValue
  }else if (c === '>'){
    return data
  }else {
    return UnQuotedAttributeValue(c)
  }
}
function singleQuotedAttributeValue(c) {
  if (c === "\'"){
    currentToKen[currentAttribute.name] = currentAttribute.value
    return afterQuotedAttributeValue
  }else if (c === '\u0000'){

  }else if (c === EDF){

  }else {
    currentAttribute.value += c
    return singleQuotedAttributeValue
  }
}
function doubleQuotedAttributeValue(c){
  if (c === "\""){
    currentToKen[currentAttribute.name] = currentAttribute.value
    return afterQuotedAttributeValue
  }else if (c === '\u0000'){

  }else if (c === EDF){

  }else {
    currentAttribute.value += c
    return doubleQuotedAttributeValue
  }
}

function afterQuotedAttributeValue(c) {
  if (c.match(/^[\t\n\f ]$/)) {
    return beforeAttributeName;
  } else if (c === "/") {
    return selfClosingStartTag;
  } else if (c === ">") {
    currentToKen[currentAttribute.name] = currentAttribute.value;
    emit(currentToKen);
    return data;
  } else if (c == EOF) {
  } else {
    currentAttribute.value += c;
    return doubleQuotedAttributeValue;
  }
}
function UnQuotedAttributeValue(c) {
  if (c.match(/^[\t\n\f ]$/)){
    currentToKen[currentAttribute.name] = currentAttribute.value
    return beforeAttributeName
  }else if (c === '/'){
    currentToKen[currentAttribute.name] = currentAttribute.value
    return selfClosingStartTag
  }else if (c === '>'){
    currentToKen[currentAttribute.name] = currentAttribute.value
    emit(currentToKen)
    return data
  }else if (c === '\u0000'){

  }else if (c === "\""|| c=== "'"|| c ==='<' || c === '='|| c === '`'){

  }else if (c === EDF){

  }else {
    currentAttribute.value += c
    return UnQuotedAttributeValue
  }
}
function selfClosingStartTag(c) {
  if (c === ">") {
    currentToKen.isSelfClosing = true;
    emit(currentToKen)
    return data;
  } else if (c == "EOF") {
  } else {
  }
}
module.exports.parseHTML = function parseHTML(html) {
 let state = data
  for (let c of html){
    state = state(c)
  }
  state = state(EDF)
  return stack[0]
}
