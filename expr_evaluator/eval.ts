class ExprContext{
    static ctx:ExprContext = new ExprContext()

    changed = false

    vars:Map<string,number> = new Map()

    rndFloatExprValues: Map<number,number> = new Map()
    rndIntExprValues: Map<number,number> = new Map()

    has(name:string):boolean{
        return this.vars.has(name)
    }
    get(name:string):number{
        return this.vars.get(name) || NaN
    }
    set(name:string, value:number){
        if(this.vars.has(name)){
            let v = this.vars.get(name) || value
            if(v == v && value == value && Math.abs(v - value) > 0.0000001){
                this.changed = true
                console.log(name, ":", this.vars.get(name), "=>", value)
            }
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
            return tag("mi") || tag("mn") || tag("msubsup") || tag("msub") || tag("msup") || tag("mfrac") || tag("mrow")
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
                assert(tag.children[1].tagName == "mi" || tag.children[1].tagName == "mn", "not supported")
                if(tag.children[2].tagName == "mo" && !is_sub((tag.children[2].textContent || "-")[0]) && !(new RegExp("^[0-9].*$").exec(tag.children[2].textContent || "0"))){
                    //角标特判，右上角标为变量名
                    return new Variable((tag.children[0].textContent || "?") + "~" + (tag.children[2].textContent || "?"), tag.children[1].textContent || "?");
                }
                let v = new Variable(tag.children[0].textContent||"?", tag.children[1].textContent||"?")
                let p = readSingleValueExpr(tag.children[2])
                return new PowExpr(v,p)
            }
            if(tag.tagName == "msub"){
                assert(tag.children[0].tagName == "mi" || tag.children[0].tagName == "mn", "not supported")
                assert(tag.children[1].tagName == "mi" || tag.children[1].tagName == "mn", "not supported")
                return new Variable(tag.children[0].textContent||"?", tag.children[1].textContent||"?")
            }
            if(tag.tagName == "msup"){
                if(tag.children[1].tagName == "mo" && !is_sub((tag.children[1].textContent || "-")[0]) && !(new RegExp("^[0-9].*$").exec(tag.children[1].textContent || "0"))){
                    //角标特判，右上角标为变量名
                    return new Variable((tag.children[0].textContent || "?") + "~" + (tag.children[1].textContent || "?"), undefined);
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
                next()
                let result = readValue(false)
                assert(mo(")"), "quote not closed")
                next()
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

class ElementFollower{
    elem:Element
    root:HTMLElement
    constructor(elem){
        this.elem = elem
        this.root = document.createElement("div")
        this.root.innerText = ""
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
        this.root.innerText = txt
    }
}

class VarProvider{
    static mathJaxUpdateTimeout:number|undefined
    input:HTMLInputElement
    low:number
    high:number
    intOnly:boolean
    intScale:number = 1
    varname:string
    init:number
    callback:()=>void
    value:number = NaN

    percentElem:HTMLElement
    textElem:HTMLElement

    readonly = false
    constructor(elem:Element, callback){
        this.callback = callback

        elem.innerHTML = `
            <div class='mathvar-input-container' style="
                display: inline-block;
                width: 80px;
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
        
        // input!.innerHTML = "<input class='mathvar-inputbox form-control' style='display:inline;width:70px;border-radius:5px' type='number'>"
        // let inputBox = elem.querySelector(".mathvar-inputbox")
        // this.input = inputBox as HTMLInputElement
        this.low = +(elem.getAttribute("data-mathvar-low") || "0")
        this.init = +(elem.getAttribute("data-mathvar-init") || "1")
        this.high = +(elem.getAttribute("data-mathvar-high") || "10")
        this.intOnly = elem.getAttribute("data-mathvar-int") == "true"
        this.varname =  elem.getAttribute("data-mathvar") || "?"

        this.setValue(this.init)

        let me = this
        clickOverlay.addEventListener('mousemove',function(ev:MouseEvent){
            if(me.readonly)
                return;
            if((ev.buttons & 1) == 0) return;
            var percent = (ev.offsetX)/this.clientWidth;
            var value = me.p2v(percent)
            me.setValue(value)
            me.callback()
        });
        
        let touch_relative_point_x = undefined;
        let touch_identifier = undefined;
        
        clickOverlay.addEventListener('touchstart', function(ev:TouchEvent){
            if(me.readonly) return;
            if(touch_identifier) return;
            if(ev.targetTouches.length == 0) return;
            touch_identifier = ev.targetTouches[0].identifier;
            touch_relative_point_x = ev.targetTouches[0].pageX;
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
        });
        
        clickOverlay.addEventListener('dblclick',function(ev){
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


    setValue(i:number){
        if(i > this.high) i = this.high
        if(i < this.low) i = this.low
        if(this.intOnly) i = Math.round(i / this.intScale) * this.intScale
        this.value = i

        let p = this.v2p(i)
        this.percentElem.style.width = (100 * (+p)) + "%"
        this.textElem.innerText = "\\(" + this.hintText(i) + "\\)"

        //update mathjax expression
        if(VarProvider.mathJaxUpdateTimeout != undefined){
            clearTimeout(VarProvider.mathJaxUpdateTimeout)
        }
        VarProvider.mathJaxUpdateTimeout = setTimeout(function(){
            VarProvider.mathJaxUpdateTimeout = undefined
            var W: any = window
            W.MathJax.typeset()
        },100)
    }

    updateContext(){
        ExprContext.ctx.set(this.varname, this.value)
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
let followers :Array<ElementFollower> = []
for(let m=0;m<maths.length;m++){
    try{
        let e = factory.fromMathML(maths[m])
        exprs.push(e)
        followers.push(new ElementFollower(maths[m]))
        console.log(e)
        console.log(e.toString())    
    }catch(e){
        console.log("以下公式没有被解析，因为",e,maths[m])
    }
}

function calculate(){
    ExprContext.ctx.reset()
    for(let i=0;i<varproviders.length;i++){
        varproviders[i].updateContext()
    }
    for(let i=0;i<100;i++){
        ExprContext.ctx.changed = false
        for(let m=0;m<exprs.length;m++){
            if(exprs[m].hasResult()){
                let result = exprs[m].result()
                console.log("公式求值：" + exprs[m].toString() + "-> " + result)
                if(followers[m]){
                    followers[m].text(result)
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

calculate()