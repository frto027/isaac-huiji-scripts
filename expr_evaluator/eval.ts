class MathJaxHelper{
    static mathJaxUpdateTimeout : number|undefined = undefined
    static queues:Set<Element> = new Set()
    static updateMathJax(elems:Array<Element>){
        var W: any = window
        for(let i=0;i<elems.length;i++){
            this.queues.add(elems[i])
        }
        // update mathjax expression
        if(MathJaxHelper.mathJaxUpdateTimeout != undefined){
            clearTimeout(MathJaxHelper.mathJaxUpdateTimeout)
        }
        MathJaxHelper.mathJaxUpdateTimeout = setTimeout(function(){
            MathJaxHelper.mathJaxUpdateTimeout = undefined
            let arg = []
            MathJaxHelper.queues.forEach(v=>arg.push(v))
            W.MathJax.typeset(arg)
        },100)

    }
}
enum VarUpdateType{
    NEW,CHANGED,NOT_CHANGED
}
class ExprContext{
    static ctx:ExprContext = new ExprContext()

    changed = false

    vars:Map<string,number> = new Map()

    rndFloatExprValues: Map<number,number> = new Map()
    rndIntExprValues: Map<number,number> = new Map()

    changedCallback:((name:string, value:number, changed:VarUpdateType)=>void)|undefined = undefined
    compareResultCallback: (expr:CompareExpr, result:boolean)=>void | undefined = undefined

    has(name:string):boolean{
        return this.vars.has(name)
    }
    get(name:string):number{
        if(this.has(name))
            return this.vars.get(name)
        return NaN
    }
    set(name:string, value:number){
        if(this.vars.has(name)){
            let v = this.vars.get(name) || value
            if(v == v && value == value && Math.abs(v - value) > 0.0000001){
                this.changed = true
                console.log(name, ":", this.vars.get(name), "=>", value)
                if(this.changedCallback)this.changedCallback(name,value, VarUpdateType.CHANGED)
            }else{
                if(this.changedCallback)this.changedCallback(name,value,VarUpdateType.NOT_CHANGED)
            }
        }else{
            if(this.changedCallback)this.changedCallback(name,value,VarUpdateType.NEW)
        }
        this.vars.set(name, value)
    }
    reset(){
        this.vars = new Map()
        this.rndFloatExprValues = new Map()
        this.rndIntExprValues = new Map()
    }
}

class Expr{
    hasResult():boolean{
        return false
    }
    result():number{
        return NaN
    }
    equal_to(result:number){
    }

    visit(func: (e:Expr)=>void){
    }

    toString(){
        return "<expr>"
    }

    isVariableExpr(){
        return false
    }
}
class ConstExpr extends Expr{
    val:number
    constructor(val:number){
        super()
        this.val = val
    }
    hasResult(): boolean {
        return true
    }
    result(): number {
        return this.val
    }
    toString(): string {
        return "" + this.val + ""
    }
}
class Variable extends Expr{
    name: string
    sub: string|undefined
    constructor(name:string, sub:string|undefined){
        super()
        this.name = name
        this.sub = sub
    }

    hasResult(): boolean {
        return ExprContext.ctx.has(this.toString())
    }
    result(): number {
        return ExprContext.ctx.get(this.toString())
    }
    equal_to(result: number): void {
        ExprContext.ctx.set(this.toString(), result)
    }

    toString(): string {
        if(this.sub) return "" + this.name + "_" + this.sub
        return "" + this.name
    }

    isVariableExpr(): boolean {
        return true
    }
}

class BinaryExpr extends Expr{
    left:Expr
    right:Expr
    op:string
    constructor(left:Expr,right:Expr,op:string){
        super()
        this.left = left
        this.right = right
        this.op = op
    }
    hasResult(): boolean {
        return this.left.hasResult() && this.right.hasResult()
    }
    visit(func: (e: Expr) => void): void {
        func(this.left)
        func(this.right)
    }
    toString(): string {
        return "(" + this.left.toString() + this.op + this.right.toString() + ")"
    }
}

class AssignExpr extends BinaryExpr{
    constructor(left:Expr,right:Expr){
        super(left,right, "=")
    }
    hasResult(): boolean {
        return this.right.hasResult() || this.left.hasResult()
    }
    result(): number {
        //side effect
        if(this.right.hasResult()){
            let result = this.right.result()
            this.left.equal_to(result)
            return result
        }else if(this.left.hasResult()){
            let result = this.left.result()
            this.right.equal_to(result)
            return result
        }
        return NaN
    }
    equal_to(result: number): void {
        this.right.equal_to(result)
        this.left.equal_to(result)
    }
}

class CompareExpr extends BinaryExpr{
    static ops = [">","<", ">=","<="]
    cmpResult : boolean|undefined = undefined

    result(): number {
        let L = this.left.result()
        let R = this.right.result()
        if(this.op == ">"){
            this.cmpResult = L > R
        }
        if(this.op == "<"){
            this.cmpResult = L < R
        }
        if(this.op == ">="){
            this.cmpResult = L >= R
        }
        if(this.op == "<="){
            this.cmpResult = L <= R
        }
        if(ExprContext.ctx.compareResultCallback){
            ExprContext.ctx.compareResultCallback(this, this.cmpResult)
        }
        return L
    }
}


class AddExpr extends BinaryExpr{
    constructor(left:Expr,right:Expr){
        super(left,right, "+")
    }
    result(): number {
        return this.left.result() + this.right.result()
    }
    equal_to(result: number): void {
        let hasL = this.left.hasResult()
        let hasR = this.right.hasResult()
        if(!hasL && hasR){
            this.left.equal_to(result - this.right.result())
        }else if(!hasR && hasL){
            this.right.equal_to(result - this.left.result())
        }
    }
}
class SubExpr extends BinaryExpr{
    constructor(left:Expr,right:Expr){
        super(left,right, "-")
    }
    result(): number {
        return this.left.result() - this.right.result()
    }
    equal_to(result: number): void {
        let hasL = this.left.hasResult()
        let hasR = this.right.hasResult()
        if(!hasL && hasR){
            this.left.equal_to(result + this.right.result())
        }else if(!hasR && hasL){
            this.right.equal_to(this.left.result() - result)
        }
    }
}

class MulExpr extends BinaryExpr{
    constructor(left:Expr,right:Expr){
        super(left,right, "*")
    }
    result(): number {
        return this.left.result() * this.right.result()
    }
    equal_to(result: number): void {
        let hasL = this.left.hasResult()
        let hasR = this.right.hasResult()
        if(!hasL && hasR){
            this.left.equal_to(result / this.right.result())
        }else if(!hasR && hasL){
            this.right.equal_to(result / this.left.result())
        }
    }
}

class DivExpr extends BinaryExpr{
    constructor(left:Expr,right:Expr){
        super(left,right, "/")
    }
    result(): number {
        return this.left.result() / this.right.result()
    }
    equal_to(result: number): void {
        let hasL = this.left.hasResult()
        let hasR = this.right.hasResult()
        if(!hasL && hasR){
            this.left.equal_to(result * this.right.result())
        }else if(!hasR && hasL){
            this.right.equal_to(this.left.result() / result)
        }
    }
}

class PowExpr extends BinaryExpr{
    constructor(left:Expr,right:Expr){
        super(left,right, "^")
    }
    result(): number {
        return Math.pow(this.left.result(), this.right.result())
    }
    equal_to(result: number): void {
        let hasL = this.left.hasResult()
        let hasR = this.right.hasResult()
        //L^R = result
        //Rlog(L) = log(result)
        //we add a condition here that L > 0
        if(!hasL && hasR){
            this.left.equal_to(Math.pow(result, 1/this.right.result()))
        }else if(!hasR && hasL){
            this.right.equal_to(Math.log(result)/Math.log(this.left.result()))
        }
    }
}

class UnaryExpr extends Expr{
    expr:Expr
    op:string
    constructor(expr:Expr, op:string){
        super()
        this.expr = expr
        this.op = op
    }
    hasResult(): boolean {
        return this.expr.hasResult()
    }
    visit(func: (e: Expr) => void): void {
        func(this.expr)
    }
    toString(): string {
        return this.op + this.expr.toString()
    }
}

class NegExpr extends UnaryExpr{
    constructor(expr:Expr){
        super(expr,"-")
    }
    result(): number {
        return -this.expr.result()
    }
    equal_to(result: number): void {
        this.expr.equal_to(-result)
    }
}

class FuncExpr extends Expr{
    name:string
    exprs:Array<Expr>
    constructor(name:string){
        super()
        this.name = name
        this.exprs = []
    }

    addArgument(expr:Expr){
        this.exprs.push(expr)
    }

    hasResult(): boolean {
        for(let i=0;i<this.exprs.length;i++){
            if(!this.exprs[i].hasResult())
                return false
        }
        return true
    }
    visit(func: (e: Expr) => void): void {
        for(let i=0;i<this.exprs.length;i++)
            func(this.exprs[i])
    }
    toString(): string {
        let ret = this.name + "("
        for(let i=0;i<this.exprs.length;i++){
            if(i > 0)
                ret += ", "
            ret += this.exprs[i].toString()
        }
        ret += ")"
        return ret
    }
}

// class FloorExpr extends FuncExpr{
//     result(): number {
//         return Math.floor(this.exprs[0]?.result() ?? NaN)
//     }
// }

class MathExpr extends FuncExpr{
    static ops = new Set(["ceil","floor","abs","sin","cos","tan"])
    result(): number {
        if(MathExpr.ops.has(this.name)){
            return Math[this.name](this.exprs[0]?.result() ?? NaN)
        }
        return NaN
    }
}

class MaxExpr extends FuncExpr{
    result(): number {
        let R = -Infinity
        for(let i=0;i<this.exprs.length;i++){
            let result = this.exprs[i].result()
            if(result > R) R = result
        }
        return R
    }
}
class MinExpr extends FuncExpr{
    result(): number {
        let R = Infinity
        for(let i=0;i<this.exprs.length;i++){
            let result = this.exprs[i].result()
            if(result < R) R = result
        }
        return R
    }
}
class IntExpr extends FuncExpr{
    result(): number {
        let r = NaN
        if(this.exprs.length > 0)
            r = this.exprs[0].result()
        if(!isNaN(r))
            r = r | 0
        return r
    }
}
class RandomFloatExpr extends FuncExpr{
    static randomIdx = 0
    randomIdx = 0
    constructor(name:string){
        super(name)
        this.randomIdx = RandomFloatExpr.randomIdx++
    }
    result(): number {
        var ctxMap = ExprContext.ctx.rndFloatExprValues
        if(!ctxMap.has(this.randomIdx)){
            ctxMap.set(this.randomIdx, Math.random())
        }
        var rnd = ctxMap.get(this.randomIdx) ?? Math.random()
        if(this.exprs.length == 2){
            let low = this.exprs[0].result()
            let high = this.exprs[1].result()
            if(isNaN(low) || isNaN(high))
                return NaN
            if(high < low)
            {
                let tmp = low
                low = high
                high = tmp
            }
            return rnd * (high - low) + low
        }
        if(this.exprs.length == 0){
            return rnd
        }
    }
}
class RandomIntExpr extends FuncExpr{
    static randomIdx = 0
    randomIdx = 0
    constructor(name:string){
        super(name)
        this.randomIdx = RandomFloatExpr.randomIdx++
    }

    result(): number {
        var ctxMap = ExprContext.ctx.rndIntExprValues
        if(!ctxMap.has(this.randomIdx)){
            ctxMap.set(this.randomIdx, Math.random())
        }
        var rnd = ctxMap.get(this.randomIdx) ?? Math.random()

        let low = 0
        let high = 0
        if(this.exprs.length == 2){
            low = this.exprs[0].result()
            high = this.exprs[1].result()
            if(isNaN(low) || isNaN(high))
                return NaN
        }
        if(this.exprs.length == 1){
            high = this.exprs[0].result()
            if(isNaN(high))
                return NaN
        }
        if(high < low){
            let tmp = high
            high = low
            low = tmp
        }
        return (rnd * (high - low) + low) | 0
    }
}
let functionKeywords = {
    __proto__: null,
    // "floor":FloorExpr,
    "int":IntExpr,
    "max":MaxExpr,
    "min":MinExpr,
    "randFloat":RandomFloatExpr,
    "randInt":RandomIntExpr
}

MathExpr.ops.forEach(v=>{
    functionKeywords[v] = MathExpr
})

class ExprException{
    elem:Element
    msg:string
    constructor(elem:Element, msg:string){
        this.elem = elem
        this.msg = msg
    }
    toString(){
        return this.msg + ": " + this.elem
    }
}

class ExprFactory{
    compareExprs:Array<{
        elem:Element,
        expr:CompareExpr
    }> = []

    fromMathML(math:Element):Expr{
        let me = this;
        var idx = 0
        function isOperator(e:Element){
            return e.tagName == "mo"
        }

        function next(){
            if(idx >= math.children.length)
                throw new ExprException(math, "need more child element")
            return math.children[idx++]
        }
        function hasMore(){
            return idx < math.children.length
        }
        function peek(){
            if(idx >= math.children.length)
                throw new ExprException(math, "no more element")
            return math.children[idx]
        }

        function tag(predict:string){
            return peek().tagName == predict
        }

        let mo_equal_maps = {
            __proto__:null,
            "*":"×∗",
            "-":"−",
            ">=":"≥",
            "<=":"≤",
            "(":"⌊⌈",
            ")":"⌋⌉"
        }
        function mo(predict:string){
            var e = peek();
            return e.tagName == "mo" && e.textContent == predict || (mo_equal_maps[predict] && mo_equal_maps[predict].indexOf(e.textContent) >= 0)
        }

        function mo_mul(){
            return mo("*")
        }
        function is_sub(ch:string){
            return ch == "-" || ch == "−"
        }
        function mo_sub(){
            return mo("-")
        }
        function ch(i:number){
            return peek().children[i]
        }
        function assert(predict, err){
            if(!predict) throw new ExprException(math, err)
        }
        function unreachable(err){throw new ExprException(math, err)}
        function readUnary():Expr{
            assert(mo_sub(), "unsupported unary op")
            next()
            let expr = readValue()
            return new NegExpr(expr)
        }

        function isSingleValue(){
            return tag("mi") || tag("mn") || tag("msubsup") || tag("msub") || tag("msup") || tag("mfrac") || tag("mrow") || tag("msqrt")
        }

        function readSingleValueExpr(tag:Element):Expr{
            if(tag.tagName == "mi"){
                let varName = tag.textContent||"?"
                let backup_idx = idx
                while(hasMore() && peek().tagName == "mi" && new RegExp("^[a-zA-Z0-9]$").exec(peek().textContent||"")){
                    varName += next().textContent || "?"
                }
                if(functionKeywords[varName])
                    return new Variable(varName, undefined)
                //关键词匹配失败，当作单个字母来做
                idx = backup_idx
                return new Variable(tag.textContent||"?", undefined)
            }
            if(tag.tagName == "mn"){
                return new ConstExpr(+(tag.textContent||NaN))
            }
            if(tag.tagName == "msubsup"){
                assert(tag.children[0].tagName == "mi" || tag.children[0].tagName == "mn", "not supported")
                if(tag.children[2].tagName == "mo" && !is_sub((tag.children[2].textContent || "-")[0]) && !(new RegExp("^[0-9].*$").exec(tag.children[2].textContent || "0"))){
                    //角标特判，右上角标为变量名
                    return new Variable((tag.children[0].textContent || "?") + "^" + (tag.children[2].textContent || "?"), tag.children[1].textContent || "?");
                }
                if(tag.children[1].tagName == "mrow"){
                    //手动处理下标为_{xxx}的情况
                    let v = new Variable(tag.children[0].textContent||"?", "{" + (tag.children[1].textContent||"?") + "}")
                    let p = readSingleValueExpr(tag.children[2])
                    return new PowExpr(v,p)
                }
                assert(tag.children[1].tagName == "mi" || tag.children[1].tagName == "mn", "not supported")
                let v = new Variable(tag.children[0].textContent||"?", tag.children[1].textContent||"?")
                let p = readSingleValueExpr(tag.children[2])
                return new PowExpr(v,p)
            }
            if(tag.tagName == "msub"){
                assert(tag.children[0].tagName == "mi" || tag.children[0].tagName == "mn", "not supported")
                if(tag.children[1].tagName == "mrow"){
                    //手动处理下标为_{xxx}的情况
                    return new Variable(tag.children[0].textContent||"?", "{" + (tag.children[1].textContent||"?") + "}")
                }
                assert(tag.children[1].tagName == "mi" || tag.children[1].tagName == "mn", "not supported")
                return new Variable(tag.children[0].textContent||"?", tag.children[1].textContent||"?")
            }
            if(tag.tagName == "msup"){
                if(tag.children[1].tagName == "mo" && !is_sub((tag.children[1].textContent || "-")[0]) && !(new RegExp("^[0-9].*$").exec(tag.children[1].textContent || "0"))){
                    //角标特判，右上角标为变量名
                    return new Variable((tag.children[0].textContent || "?") + "^" + (tag.children[1].textContent || "?"), undefined);
                }
                let v = readSingleValueExpr(tag.children[0])
                let p = readSingleValueExpr(tag.children[1])
                return new PowExpr(v,p)
            }
            if(tag.tagName == "mfrac"){
                let u= readSingleValueExpr(tag.children[0])
                let d = readSingleValueExpr(tag.children[1])
                return new DivExpr(u,d)
            }
            if(tag.tagName == "mrow"){
                if(tag.children.length == 2 && tag.children[1].tagName == "mstyle" &&
                    tag.children[1].children.length == 1
                ){
                    return me.fromMathML(tag.children[1].children[0])
                }
                return me.fromMathML(tag)
            }
            if(tag.tagName == "msqrt"){
                let body = me.fromMathML(tag)
                let r = new MathExpr("sqrt")
                r.addArgument(body)
                return r
            }
            unreachable("unknown value")
            return new Expr()
        }

        function readSingleValue():Expr{

            let ret = readSingleValueExpr(next())

            if(ret.isVariableExpr() && functionKeywords[ret.toString()] && hasMore() &&mo("(")){
                next()
                let func:typeof FuncExpr = functionKeywords[ret.toString()]
                let funcret = new func(ret.toString())
                while(!mo(")")){
                    if(funcret.exprs.length > 0){
                        assert(mo(","), "invalid argument seperator")
                        next()    
                    }
                    funcret.addArgument(readValue(false))
                }
                next()
                return funcret
            }
            return ret
        }

        function readMuls(first:Expr,op:string):Expr{
            var next 
            if(mo("(")){
                next = readValue()
            }else if(mo_sub()){
                next = readUnary()
            }else if(isSingleValue()){
                next = readSingleValue()
            }else{
                assert(false, "not support")
            }
            if(op == "*"){
                next = new MulExpr(first, next)
            }else{
                assert(op == "/", "not supported")
                next = new DivExpr(first, next)
            }
            if(hasMore()){
                if(mo("(")){
                    return readMuls(next,"*")
                }
               if(mo_mul()){
                next()
                return readMuls(next, "*")
               }
               if(mo("/")){
                next()
                return readMuls(next, "/")
               }
               if(isSingleValue()){
                return readMuls(next, "*")
               }
            }
            return next
        }
        function readAdds(first:Expr, op:string):Expr{
            let _next
            if(mo("(")){
                _next = readValue()
            }else if(mo_sub()){
                _next = readUnary()
            }else if(isSingleValue()){
                _next = readSingleValue()
            }else{
                assert(false, "not support")
            }

            function ret(L,R){
                if(op == "+") return new AddExpr(L,R);
                assert(op == "-", "unk op");
                return new SubExpr(L,R);
            }
            if(hasMore()){
                if(mo("(")){
                    _next = readMuls(_next, "*")
                }else if(mo_mul()){
                    next()
                    _next = readMuls(_next, "*")
                }else if(mo("/")){
                    next()
                    _next = readMuls(_next, "/")
                }else if(isSingleValue()){
                    _next = readMuls(_next, "*")
                }

                if(hasMore()){
                    if(mo("+")){
                        next()
                        return readAdds(ret(first, _next), "+")
                    }else if(mo_sub()){
                        next()
                        return readAdds(ret(first, _next), "-")
                    }    
                }
            }
            return ret(first, _next)
        }
        function readAssigns(first:Expr):Expr{
            return new AssignExpr(first, readValue(false))
        }
        function readValue(readAllCheck = true):Expr{
            if(mo("(")){
                let beg = next().textContent
                let result = readValue(false)
                assert(mo(")"), "quote not closed")
                let end = next().textContent
                if(beg == "⌊"){
                    assert(end == "⌋", "floor quote not closed")
                    let r = new MathExpr("floor")
                    r.addArgument(result)
                    return r
                }
                if(beg == "⌈"){
                    assert(end == "⌉", "ceil quote not closed")
                    let r = new MathExpr("ceil")
                    r.addArgument(result)
                    return r
                }
                return result
            }
            if(mo_sub()){
                return readUnary()
            }

            assert(isSingleValue(), "unknown op")

            let first = readSingleValue()
            if(!hasMore()) return first;
            if(isSingleValue()){
                first = readMuls(first, "*")
            }
            if(!hasMore()) return first;
            if(mo("(")){
                first = readMuls(first, "*")
            }
            if(!hasMore()) return first;
            if(mo_mul()){
                next()
                first =  readMuls(first,"*")
            }
            if(!hasMore()) return first
            if(mo("+")){
                next()
                first = readAdds(first, "+")
            }else if(mo_sub()){
                next()
                first = readAdds(first, "-")
            }
            if(!hasMore()) return first
            if(mo("=")){
                next()
                first =  readAssigns(first)
            }
            if(!hasMore()) return first
            for(let i=0;i<CompareExpr.ops.length;i++){
                if(mo(CompareExpr.ops[i])){
                    let elem = next()
                    first = new CompareExpr(first, readValue(false), CompareExpr.ops[i])
                    me.compareExprs.push({
                        elem : elem,
                        expr : first as CompareExpr
                    })
                    break
                }
            }
            assert(!readAllCheck || !hasMore(), "unknown ops")
            return first
        }
        return readValue()
    }
}

class Follower{
    follow(){}
    text(txt:string){}
    hide(){}
    show(){}
    isHide():boolean{return true}
    setHideAllCallback(f:()=>void){}
}


class ElementFollower extends Follower{
    elem:Element
    root:HTMLElement
    txtElem:HTMLElement
    is_hide = true
    
    hideAllCallback:()=>void = undefined
    constructor(elem){
        super()
        while(elem.tagName == "math" || elem.tagName.indexOf("mjx-")>=0  || elem.tagName.indexOf("MJX-")>=0){
            if(elem.parentElement){
                elem = elem.parentElement
            }else{
                break
            }
        }
        this.elem = elem
        this.root = document.createElement("div")
        this.root.innerHTML = `
        <span><button class='btn btn-link btn-sm follower-hide-all' style='padding:0'><i class="fa fa-times"></i></button><button class='btn btn-link btn-sm follower-hide' style='padding:0'><i class="fa fa-eye-slash"></i></button></span>
        <span class='follower-text'></span>`

        this.txtElem = this.root.querySelector(".follower-text");

        (this.root.querySelector(".follower-hide") as HTMLElement).addEventListener("click",()=>{
            this.hide()
        });
        (this.root.querySelector(".follower-hide-all") as HTMLElement).addEventListener("click",()=>{
            if(this.hideAllCallback)
                this.hideAllCallback()
        });
        this.root.style.display = "none"
        // this.root.innerText = ""
        this.root.style.position = 'absolute'
        this.root.style.padding = "2px 8px"
        this.root.style.backgroundColor = 'rgb(237 225 142 / 86%)'
        this.root.style.borderRadius = "4px"
        this.root.style.border = "solid 1px black"
        this.follow()
        document.body.append(this.root)
    }
    follow(){
        this.root.style.left = (this.elem.getBoundingClientRect().left + window.scrollX + 10) + "px"
        this.root.style.top = (this.elem.getBoundingClientRect().top + window.scrollY + 10) + "px"
    }
    text(txt){
        this.txtElem.innerText = txt
        MathJaxHelper.updateMathJax([this.txtElem])
    }

    hide(){
        this.is_hide = true
        this.root.style.display = "none"
    }
    show(){
        this.is_hide = false
        this.root.style.display="block"
    }
    isHide(): boolean {
        return this.is_hide
    }
    setHideAllCallback(f: () => void): void {
        this.hideAllCallback = f
    }
}

class VarProvider{
    static mathJaxUpdateTimeout:number|undefined
    static globalDrawStartCallback:()=>void = undefined
    input:HTMLInputElement
    low:number
    high:number
    intOnly:boolean
    intScale:number = 1
    varname:string
    init:number
    callback:()=>void
    value:number = NaN
    rndType:string = "none"

    drawStarted = false

    percentElem:HTMLElement
    textElem:HTMLElement
    clickElement:HTMLElement

    

    readonly = false
    constructor(elem:Element, callback){
        this.callback = callback

        elem.innerHTML = `
            <div class='mathvar-input-container' style="
                display: inline-block;
                width: 120px;
                height: 30px;
                position: relative;
                background-color: rgb(53, 53, 53);
                border-radius: 8px;
                margin: 0px 2px;
                user-select: none;
                vertical-align:middle;
            ">
                <div class="mathvar-text" style="position: absolute; bottom: 2px; left: 6px; user-select: none;">text</div>
                <div class="mathvar-percent" style="height: 100%; background-color: rgba(132, 130, 137, 0.16); position: absolute; border-radius: 8px; user-select: none; width: 40.5%;"></div>
                <div class="mathvar-click" style="position: absolute; inset: 0px;"></div>
            </div>
        `
        
        let container = elem.querySelector(".mathvar-input-container")!
        this.textElem = elem.querySelector(".mathvar-text")!
        this.percentElem = elem.querySelector(".mathvar-percent")!
        let clickOverlay = elem.querySelector(".mathvar-click")!
        this.clickElement = clickOverlay as HTMLElement
        
        // input!.innerHTML = "<input class='mathvar-inputbox form-control' style='display:inline;width:70px;border-radius:5px' type='number'>"
        // let inputBox = elem.querySelector(".mathvar-inputbox")
        // this.input = inputBox as HTMLInputElement
        this.low = +(elem.getAttribute("data-mathvar-low") || "0")
        this.init = +(elem.getAttribute("data-mathvar-init") || "1")
        this.high = +(elem.getAttribute("data-mathvar-high") || "10")
        this.intOnly = elem.getAttribute("data-mathvar-int") == "true"
        this.rndType = elem.getAttribute("data-mathvar-rnd") ?? "none"
        this.varname =  elem.getAttribute("data-mathvar") || "?"

        this.setValue(this.init)

        this.textElem.innerText = "   \\(" + this.varname + "\\)"
        if(this.rndType != "none"){
            this.textElem.innerHTML = '&nbsp;<i class="fa fa-random"></i>' + this.textElem.innerHTML
        }
        this.textElem.innerHTML = '<i class="fa fa-calculator"></i>' + this.textElem.innerHTML
        MathJaxHelper.updateMathJax([this.textElem])
        let me = this
        

        let value_init:number|undefined = undefined
        let need_trigger_mouse_click = true
        clickOverlay.addEventListener('mousemove',function(ev:MouseEvent){
            if(me.readonly)
                return;
            if((ev.buttons & 1) == 0) return;
            if(!me.drawStarted) me.start_draw();
            var percent = (ev.offsetX)/this.clientWidth;
            var value = me.p2v(percent)
            if(value_init == undefined){
                value_init = value
                need_trigger_mouse_click = true
                return
            }else if(value_init != value){
                need_trigger_mouse_click = false
            }
            me.setValue(value)
            me.callback()
        });
        clickOverlay.addEventListener("mouseup",function(){
            if(!me.drawStarted) me.start_draw();
            value_init = undefined
            if(need_trigger_mouse_click){
               me.rnd() 
            }
            need_trigger_mouse_click = true
        })
        
        let touch_relative_point_x = undefined;
        let touch_identifier = undefined;
        
        clickOverlay.addEventListener("click",function(){
            if(!me.drawStarted) me.start_draw();
        })

        clickOverlay.addEventListener('touchstart', function(ev:TouchEvent){
            if(!me.drawStarted){
                me.start_draw()
            }
            if(me.readonly) return;
            if(touch_identifier) return;
            if(ev.targetTouches.length == 0) return;
            touch_identifier = ev.targetTouches[0].identifier;
            touch_relative_point_x = ev.targetTouches[0].pageX;

            need_trigger_mouse_click = true;
            value_init = undefined
        });
        clickOverlay.addEventListener('touchmove',function(ev:TouchEvent){
            if(me.readonly || touch_identifier == undefined) return;
            for(var i=0;i<ev.changedTouches.length;i++){
                if(ev.changedTouches[i].identifier == touch_identifier){
                    var offset = ev.changedTouches[i].pageX - touch_relative_point_x;
                    touch_relative_point_x = ev.changedTouches[i].pageX;
                    offset /= clickOverlay.clientWidth;
                    var percent = me.v2p(me.value) + offset;
                    if(percent > 1) percent = 1;
                    if(percent < 0) percent = 0;
                    if(value_init == undefined){
                        value_init = percent
                    }else if(value_init != percent){
                        need_trigger_mouse_click = false
                    }
                    me.setValue(me.p2v(percent));
                    me.callback()
                    if(ev.cancelable)
                        ev.preventDefault();
                }
            }
        });
        clickOverlay.addEventListener('touchend',function(ev:TouchEvent){
            if(touch_identifier == undefined) return;
            for(var i=0;i<ev.changedTouches.length;i++){
                if(ev.changedTouches[i].identifier == touch_identifier){
                    touch_identifier = undefined;
                }
            }
            if(need_trigger_mouse_click){
                value_init = undefined
                me.rnd()
            }
        });
        
        clickOverlay.addEventListener('dblclick',function(ev){
            if(!me.drawStarted) me.start_draw()
            let w:any = window

            ev.preventDefault();
            if(me.readonly) return;
            var v = prompt('输入值');
            if(v == undefined) return;
            if(!(new RegExp('^-?[0-9\\.]+$').exec(v))){
                w.$message.warning("需要输入数字！");
                return;
            }
            var vNum = +v;
            if(Number.isNaN(vNum)){
                w.$message.warning("需要输入数字！");
                return;
            }
            // if(v < low) v = low;
            // if(v > high) v = high;
            me.setValue(vNum);
            me.callback()
        });

        // elem.querySelector(".mathvar-inc")?.addEventListener("click",()=>{
        //     this.setValue(1+ +this.input.value)
        //     this.callback()
        // })
        // elem.querySelector(".mathvar-dec")?.addEventListener("click",()=>{
        //     this.setValue(+this.input.value - 1)
        //     this.callback()
        // })
        // this.input.addEventListener("change",()=>{
        //     this.setValue(+this.input.value)
        //     this.callback()
        // })
    }

    start_draw(){
        this.drawStarted = true
        if(VarProvider.globalDrawStartCallback){
            VarProvider.globalDrawStartCallback()
        }
        if(this.rndType != "none"){
            this.rnd()
        }else{
            this.setValue(this.init)
        }
    }

    rnd(){
        if(this.rndType == "rnd"){
            if(this.intOnly){
                this.setValue(0|(Math.random() * (this.high - this.low + 1) + this.low), true)
            }else{
                this.setValue(Math.random() * (this.high - this.low) + this.low, true)
            }
        }
    }
    p2v(p:number){
        return this.low + (this.high - this.low) * p;
    };
    v2p(v:number){
        return (v-this.low) / (this.high - this.low);
    };

    hintText(v:number){
    	if(this.intOnly) v = Math.round(v / this.intScale) * this.intScale;
        var t = v.toString();
        if(t.length > 6)
            t = t.substring(0,6);
        return this.varname + '=' +  t;
    };


    setValue(i:number, isRandomValue:boolean = false){
        if(i > this.high) i = this.high
        if(i < this.low) i = this.low
        this.value = i
        if(this.intOnly) i = Math.round(i / this.intScale) * this.intScale

        let p = this.v2p(i)
        this.percentElem.style.width = (100 * (+p)) + "%"
        this.textElem.innerText = "\\(" + this.hintText(i) + "\\)"
        if(this.rndType != "none"){
            if (isRandomValue) {
                this.textElem.innerHTML = '<i class="fa fa-random" style="color:#e3e3e3"></i>&nbsp;&nbsp;&nbsp;' + this.textElem.innerHTML;
            }
            else {
                this.textElem.innerHTML = '<i class="fa fa-random" style="color:#757575"></i>&nbsp;&nbsp;&nbsp;' + this.textElem.innerHTML;
            }
        }
        MathJaxHelper.updateMathJax([this.textElem])
    }

    updateContext(){
        if(this.intOnly){
            ExprContext.ctx.set(this.varname, Math.round(this.value / this.intScale) * this.intScale)
        }else{
            ExprContext.ctx.set(this.varname, this.value)
        }
    }
}

let varproviders:Array<VarProvider> = []
let varproviders_elems = document.getElementsByClassName("mathvar-hint")
for(let i=0;i<varproviders_elems.length;i++){
    try{
        varproviders.push(new VarProvider(varproviders_elems[i], calculate))
    }catch(e){
        console.error(e)
    }
}

let maths = document.getElementsByTagName("math")
let factory = new ExprFactory()

let exprs:Array<Expr> = []
let followers :Array<Follower> = []

function isAllFollowersHide(){
    for(var i=0;i<followers.length;i++)
        if(!followers[i].isHide())
            return false
    return true
}

class WikiMathExpressionProperty{
    show_result:boolean
}

function need_calc_math(elem:Element, prop:WikiMathExpressionProperty){
    while(elem.tagName == "math" || elem.tagName.indexOf("mjx-")>=0  || elem.tagName.indexOf("MJX-")>=0){
        if(elem.parentElement){
            elem = elem.parentElement
        }else{
            break
        }
    }
    if(elem?.hasAttribute("data-calc") ?? false){
        if(elem.getAttribute("data-calc") == "1"){
            prop.show_result = (elem.getAttribute("data-showresult") || "1") == "1"
            return true
        }
    }
    return false
}

for(let m=0;m<maths.length;m++){
    let prop = new WikiMathExpressionProperty()
    if(!need_calc_math(maths[m], prop))
        continue
    try{
        let e = factory.fromMathML(maths[m])
        exprs.push(e)
        if(prop.show_result){
            followers.push(new ElementFollower(maths[m]))
        }else{
            followers.push(new Follower())
        }
        console.log(e)
        console.log(e.toString())    
    }catch(e){
        console.log("以下公式没有被解析，因为",e,maths[m])
    }
}

function calculate(){
    let need_display_followers = isAllFollowersHide()

    ExprContext.ctx.reset()
    for(let i=0;i<varproviders.length;i++){
        varproviders[i].updateContext()
    }
    for(let i=0;i<100;i++){
        ExprContext.ctx.changed = false
        for(let m=0;m<exprs.length;m++){
            if(exprs[m].hasResult()){
                let updated_vars = ""
                ExprContext.ctx.changedCallback = (name,vlaue,changed)=>{
                    if(updated_vars.length > 0) updated_vars += "\n"
                    let sval = vlaue + ""
                    if(sval.indexOf(".") >= 0){
                        let digit_len = sval.split(".")[1].length
                        if(digit_len > 4){
                            sval = sval.substring(0, sval.length - (digit_len - 4))
                        }
                    }
                    updated_vars += "\\(" + name + "=" + sval + "\\)"
                }

                let compare_result : boolean | undefined = undefined
                ExprContext.ctx.compareResultCallback = (expr,result)=>{
                    if(expr.cmpResult != undefined){
                        if(compare_result == undefined || compare_result){
                            compare_result = expr.cmpResult
                        }
                    }
                }

                let result = exprs[m].result()

                if(compare_result != undefined){
                    if(updated_vars.length > 0) updated_vars += "\n"
                    if(compare_result){
                        updated_vars += "成立"
                    }else{
                        updated_vars += "不成立"
                    }
                }
                // show ans
                if(updated_vars.length == 0){
                    updated_vars = "\\(ans=" + result + "\\)"
                }
                // if(updated_vars.length > 0) updated_vars += "\n"
                // updated_vars += "\\(ans=" + result + "\\)"
                console.log("公式求值：" + exprs[m].toString() + "-> " + result)
                let _follower = followers[m]
                if(_follower){
                    if(_follower.isHide() && need_display_followers)
                        _follower.show()
                    if(!_follower.isHide()){
                        _follower.text(updated_vars)
                        _follower.follow()
                    }
                }
            }
        }
        if(!ExprContext.ctx.changed){
            console.log("没有值被更新，迭代终止")
            break
        }
    }
    if(ExprContext.ctx.changed){
        console.log("公式结果未收敛")
    }
}

VarProvider.globalDrawStartCallback = function(){
    VarProvider.globalDrawStartCallback = undefined
    for(let i=0;i<varproviders.length;i++){
        if(!varproviders[i].drawStarted)
            varproviders[i].start_draw()
    }
    calculate()
}

for(let i=0;i<followers.length;i++){
    followers[i].setHideAllCallback(function(){
        for(let i=0;i<followers.length;i++){
            followers[i].hide()
        }
    })
}
if(followers.length > 0){
    window.addEventListener("resize", function(){
        for(let i=0;i<followers.length;i++){
            followers[i].follow()
        }
    })    
}

// calculate()