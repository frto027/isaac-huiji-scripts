function displayDebugMessage(){
    return window["mathJaxCalcDebug"] == "1"
} 

const jsOnly = false

{
    let edom = document.createElement("script")
    edom.src = 'https://spa.huijistatic.com/www/echarts/5.4.0/echarts.min.js'
    document.body.append(edom)
}

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
            calculateEcharts()
        },100)

    }
}
enum VarUpdateType{
    NEW,CHANGED,NOT_CHANGED
}

interface CompareExprLike{
    cmpResult : boolean|undefined
}

class ExprContext{
    static ctx:ExprContext = new ExprContext()

    changed = false

    vars:Map<string,number> = new Map()

    rndFloatExprValues: Map<number,number> = new Map()
    rndIntExprValues: Map<number,number> = new Map()

    changedCallback:((name:string, value:number, changed:VarUpdateType)=>void)|undefined = undefined
    compareResultCallback: (expr:CompareExprLike, result:boolean)=>void | undefined = undefined

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
                // console.log(name, ":", this.vars.get(name), "=>", value)
                if(this.changedCallback)this.changedCallback(name,value, VarUpdateType.CHANGED)
            }else{
                if(this.changedCallback)this.changedCallback(name,value,VarUpdateType.NOT_CHANGED)
            }
        }else{
            this.changed = true
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

    toAssignExpr():AssignExpr|undefined{
        return undefined
    }
    toSelectExpr():SelectExpr|undefined{
        return undefined
    }
    toLogExpr():LogExpr|undefined{
        return undefined
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
    cmpResult : boolean|undefined = undefined
    canBeCmp : boolean = true
    constructor(left:Expr,right:Expr){
        super(left,right, "=")
    }
    hasResult(): boolean {
        return this.right.hasResult() || this.left.hasResult()
    }
    result(): number {
        //side effect
        this.cmpResult = undefined
        let rresult = this.right.hasResult()
        let lresult = this.left.hasResult()
        if(this.canBeCmp && rresult && lresult){
            let r = this.right.result()
            let l = this.left.result()
            this.cmpResult = Math.abs(l-r) < 0.0000001
            if(ExprContext.ctx.compareResultCallback){
                ExprContext.ctx.compareResultCallback(this, this.cmpResult)
            }    
            return l
        }
        if(rresult){
            let result = this.right.result()
            this.left.equal_to(result)
            return result
        }else if(lresult){
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

    toAssignExpr(): AssignExpr | undefined {
        return this
    }
}

class CompareExpr extends BinaryExpr{
    static ops = [">","<", ">=","<=", "!="]
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
        if(this.op == "!="){
            this.cmpResult = Math.abs(L-R) >= 0.0000001
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
        return "(" + this.op + "(" + this.expr.toString() + "))"
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

interface SelectExprItem{
    value:Expr
    cond:Expr
}
//表达式带条件连列
class SelectExpr extends Expr{
    items:Array<SelectExprItem> = []
    hasResult(): boolean {
        for(let i=0;i<this.items.length;i++){
            if(!this.items[i].value.hasResult())
                return false
            if(!this.items[i].cond.hasResult())
                return false            
        }
        return true
    }
    result(): number {
        for(let i=0;i<this.items.length;i++){
            let oldCallback = ExprContext.ctx.compareResultCallback
            let cond = true
            ExprContext.ctx.compareResultCallback = function(expr, result){
                if(result == undefined || result == false){
                    cond = false
                }
            }
            this.items[i].cond.result()
            ExprContext.ctx.compareResultCallback = oldCallback
            if(cond){
                return this.items[i].value.result()
            }
        }
        return NaN
    }
    visit(func: (e: Expr) => void): void {
        for(let i=0;i<this.items.length;i++){
            func(this.items[i].cond)
            func(this.items[i].value)
        }
    }
    toString(): string {
        let r = "{"
        for(let i=0;i<this.items.length;i++){
            r +="[if:" + this.items[i].cond.toString() + ",then:"
            r += this.items[i].value.toString() + "]"
        }
        r += "}"
        return r
    }
    toSelectExpr(): SelectExpr | undefined {
        return this
    }
}

class MathExpr extends FuncExpr{
    static ops = new Set(["ceil","floor","abs","sin","cos","tan","sqrt"])
    result(): number {
        if(MathExpr.ops.has(this.name)){
            return Math[this.name](this.exprs[0]?.result() ?? NaN)
        }
        return NaN
    }
}

class LgExpr extends FuncExpr{
    result(): number {
        return Math.log10(this.exprs[0]?.result() ?? NaN)
    }
}
class LbExpr extends FuncExpr{
    result(): number {
        return Math.log2(this.exprs[0]?.result() ?? NaN)
    }
}
class LogExpr extends FuncExpr{
    result(): number {
        let base = this.exprs[0]?.result() ?? NaN
        let x = this.exprs[1]?.result() ?? NaN
        return Math.log(x)/Math.log(base) /* 换底公式 */
    }

    toLogExpr():LogExpr|undefined{
        return this
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
    "randInt":RandomIntExpr,
    "lg":LgExpr,
    "lb":LbExpr
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

class fromMathResult{
    end_idx:number // next idx that needs read
}

class ExprFactory{
    compareExprs:Array<{
        elem:Element,
        expr:CompareExpr
    }> = []

    fromMathML(math:Element, readAllCheck = true, init_idx = 0, result:fromMathResult|undefined = undefined):Expr{
        let me = this;
        var idx = init_idx
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
            "!=":"≠",
            "(":"⌊⌈",
            ")":"⌋⌉",
            "":'⁡' /* invisible character here */
        }
        function mo(predict:string){
            var e = peek();
            if(e.tagName == "mo"){
                return e.textContent == predict || (mo_equal_maps[predict] && mo_equal_maps[predict].indexOf(e.textContent) >= 0)
            }
            if(e.tagName == "mrow" && e.children.length == 1 && e.children[0].tagName == "mo"){
                return e.children[0].textContent == predict || (mo_equal_maps[predict] && mo_equal_maps[predict].indexOf(e.children[0].textContent) >= 0)
            }
            return false
        }

        function is_sub(ch:string){
            return ch == "-" || ch == "−"
        }
        function assert(predict, err){
            if(!predict) throw new ExprException(math, err)
        }
        function unreachable(err){throw new ExprException(math, err)}

        function isSingleValue(){
            if(tag("mi") && peek().textContent == "%")
                return false
            const singleValueTagNames = [
                "mi","mn","msubsup","msub","msup","mfrac","mrow","msqrt"
            ]

            if(tag("mstyle") && peek().children.length == 1){
                //有时候内容会被包裹在一个mstyle里面
                return singleValueTagNames.indexOf(peek().children[0].tagName) >= 0
            }
            if(tag("mo") && functionKeywords[peek().textContent] != undefined)
                return true
            if(tag("mrow") && peek().children.length == 1 && peek().children[0].tagName == "mo")
                return false;//一个单独的/斜杠被包裹在mrow里，就是普通的除号
            return singleValueTagNames.indexOf(peek().tagName) >= 0
        }

        function readSingleValueExpr(tag:Element):Expr{
            if(tag.tagName == "mstyle" && tag.children.length == 1){
                return readSingleValueExpr(tag.children[0])
            }
            if(tag.tagName == "mo" && functionKeywords[tag.textContent] != undefined){
                return new Variable(tag.textContent,undefined)
            }

            if(tag.tagName == "mi"){
                let varName = tag.textContent||"?"
                let backup_idx = idx
                while(hasMore() && peek().tagName == "mi" && new RegExp("^[a-zA-Z0-9]$").exec(peek().textContent||"")){
                    varName += next().textContent || "?"
                }
                if(functionKeywords[varName])
                    return new Variable(varName, undefined)
                if(varName == "log"){
                    let r = new LogExpr("log")
                    r.addArgument(new ConstExpr(10))
                    return r
                }
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
                if(tag.children.length == 2 && tag.children[0].tagName == "mi" && tag.children[0].textContent == "log"){
                    //log_x(y)
                    let base = readSingleValueExpr(tag.children[1])
                    let ret = new LogExpr("log")
                    ret.addArgument(base)
                    return ret /* Fix ret in the future */
                }
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
                if(tag.children.length == 3 &&
                    tag.children[0].tagName == "mo" && tag.children[0].textContent == "{" &&
                    tag.children[1].tagName == "mtable" &&
                    tag.children[2].tagName == "mo"){
                        //单个大括号，带条件连列
                        let table = tag.children[1]
                        let r = new SelectExpr()
                        for(let i=0;i<table.children.length;i++){
                            let mtr = table.children[i]
                            assert(mtr.tagName == "mtr", "invalid table line inside select quote")
                            assert(mtr.children.length == 2, "we need 2 children in one raw inside select quote")
                            let value = mtr.children[0]
                            let cond = mtr.children[1]
                            assert(value.tagName == "mtd" && cond.tagName == "mtd", "invalid tag name inside select quote(need mtd)")
                            let valueExpr = me.fromMathML(value)
                            let condExpr = me.fromMathML(cond)
                            r.items.push({
                                cond:condExpr,
                                value:valueExpr
                            })
                        }
                        return r
                    }
                if(tag.children.length == 2 && tag.children[1].tagName == "mstyle" &&
                    tag.children[1].children.length == 1
                ){
                    //一对不存在的大括号的情况
                    return me.fromMathML(tag.children[1].children[0])
                }
                // \dfrac{1}{\max\left(1,10 - \left\lfloor\dfrac{P_{幸运} }{3}\right\rfloor \right)
                if(tag.children.length == 2 && tag.children[0].tagName == "mo" && functionKeywords[tag.children[0].textContent]){
                    //this is a function call
                    let func:typeof FuncExpr = functionKeywords[tag.children[0].textContent]
                    let funcarg = tag.children[1]
                    let r = new func(tag.children[0].textContent)
                    if(funcarg.tagName == "mrow"){
                        let status : fromMathResult = {
                            end_idx: 0
                        }

                        let arg_mo = (x:string)=>{
                            if(status.end_idx >= funcarg.children.length)
                                return false
                            let e = funcarg.children[status.end_idx]
                            if(e.tagName != "mo")
                                return false
                            if(e.textContent == x)
                                return true
                            if(mo_equal_maps[x] && mo_equal_maps[x].indexOf(e.textContent) >= 0)
                                return true
                            return false
                        }

                        assert(arg_mo("("), "( needed")
                        status.end_idx++
                        if(arg_mo(")")){
                            assert(status.end_idx + 1 == funcarg.children.length, "some elements is not read")
                        }else{
                            while(true){
                                let expr = me.fromMathML(funcarg, false, status.end_idx, status)
                                r.addArgument(expr)
                                if(arg_mo(")")){
                                    assert(status.end_idx + 1 == funcarg.children.length, "some elements is not read")
                                    break
                                }
                                assert(arg_mo(","), "next argument expected")
                                status.end_idx++
                            }    
                        }
                    }else{
                        r.addArgument(readSingleValueExpr(funcarg))
                    }
                    return r
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
            while(hasMore() && mo(""))
                next()//empty next inside sin function

            function readFunctionArguments(funcret:FuncExpr){
                assert(mo("("), "'(' expected")
                next()
                if(mo(")"))
                    return
                funcret.addArgument(readValue(false))
                while(!mo(")")){
                    if(funcret.exprs.length > 0){
                        assert(mo(","), "invalid argument seperator")
                        next()    
                    }
                    funcret.addArgument(readValue(false))
                }
                next()
            }

            // handle function
            if(ret.isVariableExpr() && functionKeywords[ret.toString()] && hasMore() &&mo("(")){
                let func:typeof FuncExpr = functionKeywords[ret.toString()]
                let funcret = new func(ret.toString())
                readFunctionArguments(funcret)
                return funcret
            }
            //handle log function argument
            if(ret.toLogExpr()){
                if(hasMore() && mo("(")){
                    readFunctionArguments(ret.toLogExpr())
                    return ret    
                }
                if(hasMore()){
                    ret.toLogExpr().addArgument(readValue(false, 500 /* ADD_SUB */))
                    return ret
                }
            }

            return ret
        }
        function readValue(readAllCheck = true, priority = -1):Expr{
            const P_MUL = 700
            const P_ADDSUB = 500
            const P_UNARY = 1000
            const P_CMP_OR_EQUALS = 100

            let first :Expr | undefined = undefined

            while(true){
                while(hasMore() && mo(""))
                    next()//ignore empty mo

                if(!hasMore()){
                    assert(first != undefined, "no value was readed")
                    return first
                }
                if(isSingleValue()){
                    if(first == undefined){
                        first = readSingleValue()
                    }else if(priority < P_MUL){
                        first = new MulExpr(first, readSingleValue())
                    }else{
                        return first
                    }
                }else if(mo("(")){
                    if(first == undefined){
                        //read it
                    }else if(priority > P_MUL){
                        return first
                    }
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
                    if(first == undefined)
                        first = result
                    else
                        first = new MulExpr(first, result)
                }else if(mo("-")){
                    if(first == undefined){
                        next()
                        first = new NegExpr(readValue(false, P_UNARY))
                    }else if(priority < P_ADDSUB){
                        next()
                        first = new SubExpr(first, readValue(false, P_ADDSUB))
                    }else{
                        return first
                    }
                }else if(mo("+")){
                    if(first == undefined){
                        next()
                        first = readValue(false, P_ADDSUB)
                    }else if(priority < P_ADDSUB){
                        next()
                        first = new AddExpr(first, readValue(false, P_ADDSUB))
                    }else{
                        return first
                    }
                }else if(mo("*")){
                    assert(first != undefined, "* can't be the first operator")
                    if(priority < P_MUL){
                        next()
                        first = new MulExpr(first, readValue(false, P_MUL))
                    }else{
                        return first
                    }
                }else if(mo("/")){
                    assert(first != undefined, "/ can't be the first operator")
                    if(priority < P_MUL){
                        next()
                        first = new DivExpr(first, readValue(false, P_MUL))
                    }else{
                        return first
                    }
                }else if(peek().tagName == "mi" && peek().textContent == "%"){
                    if(priority < P_MUL){
                        next()
                        first = new DivExpr(first, new ConstExpr(100))
                    }else{
                        return first
                    }
                }else if(mo("=")){
                    if(priority <= P_CMP_OR_EQUALS){
                        next()
                        first = new AssignExpr(first, readValue(false, P_CMP_OR_EQUALS))
                    }else{
                        return first
                    }
                }else{
                    //handle all compares
                    let something_happened = false
                    for(let i=0;i<CompareExpr.ops.length;i++){
                        if(mo(CompareExpr.ops[i])){
                            if(priority <= P_CMP_OR_EQUALS){
                                let elem = next()
                                first = new CompareExpr(first, readValue(false, P_CMP_OR_EQUALS), CompareExpr.ops[i])
                                me.compareExprs.push({
                                    elem : elem,
                                    expr : first as CompareExpr
                                })
                                something_happened = true
                                break
                            }else{
                                return first
                            }
                        }
                    }
                    if(something_happened){
                        continue
                    }else{
                        assert(!readAllCheck || !hasMore(), "unknown ops")
                        assert(first != undefined, "nothing was read")
                        return first
                    }
                }
            }
        }
        let ret = readValue(readAllCheck)
        if(result){
            result.end_idx = idx
        }
        return ret
    }
}

class EchartsYData{
    value:number[] = []
}

class EchartsData{
    x_tag:string
    data_count:number

    x:number[]
    y:Map<string, EchartsYData>

    reset(x_tag:string){
        this.x_tag = x_tag
        this.x = []
        this.y = new Map()
    }
}

class Follower{
    prop:WikiMathExpressionProperty

    follow(){}
    text(txt:string){}
    hide(){}
    show(){}
    isHide():boolean{return true}
    setHideAllCallback(f:()=>void){}
    removeHideAllBtn(){}

    echartsData:EchartsData|undefined = undefined
    needEchartsData(){return false}
    updateEcharts(){}
    needCalculateEchart(){return false}

    isUsefulFollower(){return false}
    setZIndex(idx:number){}
    getZIndex():number{return 0}

    toElementFollower():ElementFollower|undefined{
        return undefined
    }
}


class ElementFollower extends Follower{
    elem:HTMLElement
    root:HTMLElement
    txtElem:HTMLElement
    echartsElem:HTMLElement
    echartsObject:any = undefined
    echartsMarkPointCount:number = 0
    is_hide = true

    is_show_echart = false
    
    floatPosX = 0
    floatPosY = 0
    floatIndicator :HTMLElement

    echartsData = new EchartsData()
    echartsMergeTo:ElementFollower|undefined = undefined

    hideAllCallback:()=>void = undefined

    toElementFollower(): ElementFollower | undefined {
        return this
    }
    needEchartsData(): boolean {
        return this.is_show_echart
    }
    constructor(elem){
        super()
        while(elem.tagName == "math" || elem.tagName.indexOf("mjx-")>=0  || elem.tagName.indexOf("MJX-")>=0){
            if(elem.parentElement){
                elem = elem.parentElement
            }else{
                break
            }
        }

        let is_katex = false
        while(elem && elem.classList.contains("katex-mathml") || elem.classList.contains("katex")){
            elem = elem.parentElement
            is_katex = true
        }
        if(is_katex && elem && !elem.hasAttribute("data-calc"))
            elem = elem.parentElement
    
        this.elem = elem
        this.root = document.createElement("div")
        this.root.innerHTML = `
        <span class='follower-text mathjax-follower-text'></span>
        <span class='mathjax-follower-btns'>
        <button class='btn btn-link btn-sm follower-drag-and-drop'><i class="fa fa-arrows"></i></button>
        <button class='btn btn-link btn-sm follower-echart-show'>F(x)</button>
        <button class='btn btn-link btn-sm follower-hide-all'><i class="fa fa-eye-slash"></i></button>
        <button class='btn btn-link btn-sm follower-hide'><i class="fa fa-times"></i></button>
        </span>
        <div class='echarts-elem mathjax-follower-echart'></div>`

        this.txtElem = this.root.querySelector(".follower-text");

        this.echartsElem = this.root.querySelector(".echarts-elem");
        this.echartsElem.style.display = 'none';

        (this.root.querySelector(".follower-hide") as HTMLElement).addEventListener("click",()=>{
            this.hide()
        });
        (this.root.querySelector(".follower-hide-all") as HTMLElement).addEventListener("click",()=>{
            if(this.hideAllCallback)
                this.hideAllCallback()
        });

        (this.root.querySelector(".follower-echart-show") as HTMLElement).addEventListener("click",()=>{
            if(this.echartsMergeTo != undefined){
                if(this.echartsMergeTo.isHide())
                    this.echartsMergeTo.show()
                if(!this.echartsMergeTo.is_show_echart){
                    this.echartsMergeTo.is_show_echart = true
                    calculateEcharts()// this.echartsMergeTo.updateEcharts()
                    updateFrontFollower(this.echartsMergeTo)
                }else{
                    //TODO: 已在别处显示，提示一下
                }
                return
            }
            if(this.is_show_echart){
                this.is_show_echart = false
                this.echartsElem.style.display = "none"
            }else{
                this.is_show_echart = true
                calculateEcharts()//this.updateEcharts()    
                updateFrontFollower(this)
            }
            this.follow()
        });

        {
            //setup drag and drop
            let dropBtn = this.root.querySelector(".follower-drag-and-drop") as HTMLElement
            let mousemoving = false
            let initDeltaX,initDeltaY
            dropBtn.addEventListener("mousedown",(e:MouseEvent)=>{
                mousemoving = true
                initDeltaX = this.floatPosX - e.pageX
                initDeltaY = this.floatPosY - e.pageY
                e.preventDefault()
            })
            document.body.addEventListener("mousemove",(e:MouseEvent)=>{
                if(mousemoving){
                    this.floatPosX = initDeltaX + e.pageX
                    this.floatPosY = initDeltaY + e.pageY
                    this.follow()
                    e.preventDefault()
                }
            })
            document.body.addEventListener("mouseup",(e)=>{
                if(mousemoving){
                    mousemoving = false
                    e.preventDefault()
                }
            })
            // dropBtn.addEventListener("mouseleave",()=>{
            //     mousemoving = false
            // })

            let touch_identifier = undefined
            let init_point_x,init_point_y

            dropBtn.addEventListener("touchstart",(ev:TouchEvent)=>{
                if(touch_identifier) return;
                if(ev.targetTouches.length == 0) return;
                touch_identifier = ev.targetTouches[0].identifier;
                init_point_x = this.floatPosX - ev.targetTouches[0].pageX;
                init_point_y = this.floatPosY - ev.targetTouches[0].pageY;
                ev.preventDefault()
            })
            dropBtn.addEventListener("touchmove",(ev)=>{
                for(var i=0;i<ev.changedTouches.length;i++){
                    if(ev.changedTouches[i].identifier == touch_identifier){
                        this.floatPosX = init_point_x + ev.changedTouches[i].pageX
                        this.floatPosY = init_point_y + ev.changedTouches[i].pageY
                        this.follow()
                        ev.preventDefault()
                    }
                }
            })
            dropBtn.addEventListener("touchend",(ev)=>{
                for(var i=0;i<ev.changedTouches.length;i++){
                    if(ev.changedTouches[i].identifier == touch_identifier){
                        touch_identifier = undefined;
                        ev.preventDefault()
                    }
                }    
            })
        }
        
        this.root.style.display = "none"
        if(jsOnly){
            this.root.style.textAlign = "right"
            this.root.style.position = 'absolute'
            this.root.style.padding = "2px 8px"
            this.root.style.backgroundColor = 'rgb(253 196 144 / 100%)'
            this.root.style.borderRadius = "4px"
            this.root.style.border = "solid 1px black"
            this.root.style.padding = "4px 8px"

            this.echartsElem.style.width = "300px"
            this.echartsElem.style.height = "120px"
        }


        this.root.classList.add("mathjax-follower-bg")
        this.root.style.zIndex = "5"
        // document.body.append(this.root)

        if(this.elem){
            let floatContainer = document.createElement("div")
            floatContainer.style.display = 'inline-block'
            floatContainer.style.position = 'relative'
            floatContainer.style.width = "0"
            floatContainer.style.height = "0"
            floatContainer.style.verticalAlign = 'top'
            
            this.floatIndicator = document.createElement("hr")
            this.floatIndicator.style.width = "0"
            this.floatIndicator.style.position = "absolute" 
            this.floatIndicator.style.display = "none"
            this.floatIndicator.classList.add("follower-hr-line")

            floatContainer.appendChild(this.floatIndicator)
            floatContainer.appendChild(this.root)
            if(this.elem.children.length > 0){
                this.elem.insertBefore(floatContainer, this.elem.firstChild)
            }else{
                this.elem.appendChild(floatContainer)
            }
        }

        this.follow()


        this.root.addEventListener("click",()=>{
            updateFrontFollower(this)
        })
    }
    isUsefulFollower(): boolean {
        return true
    }

    setZIndex(idx: number): void {
        this.root.style.zIndex = idx + ""
    }
    getZIndex(): number {
        return +(this.root.style.zIndex)
    }
    removeHideAllBtn(){
        let btn = this.root.querySelector(".follower-hide-all")
        if(btn){
            btn.remove()
        }
    }
    follow_offset = undefined
    follow(){
        let rect = this.elem.getBoundingClientRect()
        let mrect = this.root.getBoundingClientRect()
        
        let X = (rect.width - mrect.width)/2
        let Y = (rect.height - mrect.height)/2
        if(X < 0)
            X = 0
        if(Y < 0)
            Y = 0
        X += this.floatPosX
        Y += this.floatPosY

        this.root.style.left =X + "px"
        this.root.style.top = Y + "px"

        let dX = X - rect.width/2
        let dY = Y - rect.height/2

        //to the center instead of LU
        dX += mrect.width/2

        this.floatIndicator.style.left = rect.width/2 + "px"
        this.floatIndicator.style.top = rect.height/2 + "px"
        let length = Math.sqrt(dX * dX + dY * dY)
        this.floatIndicator.style.width = length + "px"
        let angle = Math.atan2(dY, dX)
        let transform = 
            "translate(" + (-length/2) + "px,0px) rotate(" + angle + "rad) translate(" + (length/2) + "px,0px)"

        this.floatIndicator.style.transform = transform
    }
    text(txt){
        this.txtElem.innerText = txt
        MathJaxHelper.updateMathJax([this.txtElem])
    }

    hide(){
        this.is_hide = true
        this.is_show_echart = false
        this.echartsElem.style.display = 'none'
        this.root.style.display = "none"
        this.echartsElem.style.display = "none"
        this.floatIndicator.style.display = "none"
    }
    show(){
        this.is_hide = false
        this.root.style.display="block"
        this.floatIndicator.style.display="block"
    }
    isHide(): boolean {
        return this.is_hide
    }
    setHideAllCallback(f: () => void): void {
        this.hideAllCallback = f
    }

    needCalculateEchart(): boolean {
        return this.is_show_echart
    }
    updateEcharts(): void {
        if(!this.is_show_echart)
            return
        this.echartsElem.style.display = "block"
        let fixed = (x:number)=>{
            let r = cut_value(x, false, true)
            return r
            // let r:string = x.toFixed(4)
            // let tail = r.length
            // if(re.exec(r)){
            //     while(tail > 1 && r[tail-1] == '0')
            //         tail--
            //     if(tail > 1 && r[tail-1] == '.')
            //         tail--    
            // }
            // return r.substring(0,tail)
        }
        let fixedY = (x:number)=>{
            let show_percent = this.prop && this.prop.show_percent
            return cut_value(x, show_percent, true, false)
            // let r:string = x.toFixed(4)
            // if(show_percent){
            //     r = (x * 100).toFixed(2)
            // }
            // let tail = r.length
            // if(re.exec(r)){
            //     while(tail > 1 && r[tail-1] == '0')
            //         tail--
            //     if(tail > 1 && r[tail-1] == '.')
            //         tail--
            // }
            // return r.substring(0,tail) + (show_percent ? "%" : "")
        }
        function cleanup_mathjax(n:string):string{
            let m = new RegExp("^(.*)_\\{?(.*?)\\}?$").exec(n)
            if(m){
                return m[1].replace("^","") + m[2]
            }else{
                return n.replace("^","")
            }
        }
        function escapeHtml(x:string):string{
            return window['echarts'].format.encodeHTML(x)
        }
        function name_to_html(n:string):string{
            let m = new RegExp("^(.*)_\\{?(.*?)\\}?$").exec(n)
            if(m){
                return escapeHtml(m[1].replace("^","")) + "<sub>" + escapeHtml(m[2]) + "</sub>"
            }else{
                return escapeHtml(n.replace("^",""))
            }
        }

        let mark_point_count = 0
        /* echarts选项样式 */
        let option = {
            xAxis:{
                name:cleanup_mathjax(this.echartsData.x_tag).replace(new RegExp("[<>]"),""), /* 无需过滤，意思一下 */
                splitLine:{
                    lineStyle:{
                      color:'black'
                    }
                },
                axisLine:{
                    onZero: false
                }
            },
            yAxis:{
                splitLine:{
                  lineStyle:{
                    color:'black'
                  }
                },
                axisLabel:{
                    formatter:(v)=>{
                        return fixedY(v)
                    }
                },
                axisLine:{
                    onZero: false
                }

            },
            title:{show:false},
            legend:{show:false},
            grid: {
                left:  50,
                right: 60,
                top: 40,
                bottom: 30
              },
            tooltip:{
                trigger:'axis',
                axisPointer: {
                    type: 'line',
                    lineStyle:{
                        color:"black"
                    }
                },
          
                formatter:(p:any)=>{
                    let ret = ""
                    for(let i=0;i<p.length;i++){
                        if(i==0){
                            ret = "当" + name_to_html(this.echartsData.x_tag) + "=" + fixed(p[i].data[0]) + "时<br>"
                        }else{
                            ret += "<br>"
                        }
                        ret += name_to_html(p[i].seriesName) + "=" + fixedY(p[i].data[1])
                    }
                    return ret
                },
                valueFormatter:function(v:number){
                    return fixedY(v)
                }
            },
            series:[]
        }

        let graph_type = VarProvider.lastTouchedVarProvider?.getEchartType() ?? 'line'

        this.echartsData.y.forEach((v,k)=>{
            if(this.echartsData.y.size > 1 && k == "ans")
                return

            let yname = cleanup_mathjax(k).replace(new RegExp("[<>]"),"")

            let only_has_one_yaxis = false
            if(this.echartsData.y.size == 1 || 
                (this.echartsData.y.size == 2 && this.echartsData.y.has("ans"))){
                option.yAxis['name'] = yname
                only_has_one_yaxis = true
            }
    
            let values = []
            for(let i=0;i<this.echartsData.x.length;i++){
                if(v.value[i] != undefined){
                    values.push([this.echartsData.x[i], v.value[i]])
                }
            }
            option.series.push({
                type:graph_type,
                name:yname,
                data:values,
                symbol:'none',
            })

            for(let i=0;i<100;i++){
                if(this.echartsData.x[-1-i] == undefined)
                    break;
                mark_point_count++

                let item_style = ()=>{
                    if(graph_type == 'bar'){
                        return  {
                            borderWidth: 2,
                            borderColor: 'black',
                            color:'black'
                        }
                    }
                        
                    return {
                        borderWidth: 2,
                        borderColor: '#EE6666',
                        color: i == 0 ? 'green' : 'white'
                    }
                }

                option.series.push({
                    type:graph_type,
                    name:yname,
                    tooltip:{show:false},
                    barGap: "-100%",
                    label: {
                        "show": true, 
                        color:'black',
                        textBorderColor: 'white',
                        textBorderWidth:2,
                        formatter: (only_has_one_yaxis ?
                            (params) => {
                                return "(" + fixed(params.data[0]) + ", " + fixedY(params.data[1]) + ")"
                            }:
                            (params) => {
                                return cleanup_mathjax(params.seriesName).replace(new RegExp("[{}]"), "")
                                + " (" + fixed(params.data[0]) + ", " + fixedY(params.data[1]) + ")"
                            }
                        )
                   },
                   data:[[this.echartsData.x[-1-i], v.value[-1-i]]],
                    symbol: 'circle',
                    symbolSize: 5,
                    itemStyle: item_style()
                })
            }
            
        })
        // console.log(option)

        let canMerge = this.echartsMarkPointCount <= mark_point_count
        this.echartsMarkPointCount = mark_point_count
        
        if(this.echartsObject == undefined){
            this.echartsObject = window["echarts"].init(this.echartsElem)
        }
        this.echartsObject.setOption(option, !canMerge)
    }
}

class VarProviderCluster{
    static instance = new VarProviderCluster()

    maps = new Map<string, Array<VarProvider>>()
    register(provider:VarProvider){
        if(!this.maps.has(provider.varname))
            this.maps.set(provider.varname, [])
        this.maps.get(provider.varname).push(provider)
    }

    setValue(varname:string, value:number, isRandomValue = false){
        let changed = false
        if(!this.maps.has(varname))
            throw new Error("unknown varprovider for " + varname)
        for(let k of this.maps.get(varname)){
            k.setValue(value, isRandomValue)
            changed = true
        }
        return changed
    }
}

class VarProvider{
    static echartType = new Set(["line", "bar"])

    static lastTouchedVarProvider:VarProvider|undefined = undefined

    static mathJaxUpdateTimeout:number|undefined
    static globalDrawStartCallback:()=>void = undefined

    input:HTMLInputElement
    low:number
    high:number
    intOnly:boolean
    intScale:number = 1
    varname:string
    init:number
    callback:()=>void // on value changed callback
    value:number = NaN
    rndType:string = "none"

    echartType:string|undefined

    highlightValues:number[] = []

    drawStarted = false

    percentElem:HTMLElement
    textElem:HTMLElement
    clickElement:HTMLElement

    isLocked = false
    lockBtn:HTMLElement|undefined

    helpBtn:HTMLElement

    readonly = false
    constructor(elem:Element, callback){
        this.callback = callback

        elem.innerHTML = `
            <div class='mathvar-input-container'>
                <div class="mathvar-text">text</div>
                <div class="mathvar-percent"></div>
                <div class="mathvar-click"></div>
            </div>
            <button class='mathvar-lock-btn btn btn-sm btn-link'><i class="fa fa-unlock"></i></button>
            <sup><a class='mathvar-help-btn btn btn-sm btn-link' style="display:none" href='/wiki/帮助:公式计算器'><i class="fa fa-question-circle-o"></i></a></sup>
        `
        
        let container:HTMLElement = elem.querySelector(".mathvar-input-container")!
        this.textElem = elem.querySelector(".mathvar-text")!
        this.percentElem = elem.querySelector(".mathvar-percent")!
        this.lockBtn = elem.querySelector(".mathvar-lock-btn")!
        this.helpBtn = elem.querySelector(".mathvar-help-btn")!
        
        let clickOverlay = elem.querySelector(".mathvar-click")!
        this.clickElement = clickOverlay as HTMLElement
        
        
        // input!.innerHTML = "<input class='mathvar-inputbox form-control' style='display:inline;width:70px;border-radius:5px' type='number'>"
        // let inputBox = elem.querySelector(".mathvar-inputbox")
        // this.input = inputBox as HTMLInputElement
        this.low = +(elem.getAttribute("data-mathvar-low") || "0")
        this.init = +(elem.getAttribute("data-mathvar-init") || "1")
        this.high = +(elem.getAttribute("data-mathvar-high") || "10")
        this.intOnly = elem.getAttribute("data-mathvar-int") == "true" || elem.getAttribute("data-mathvar-int") == "1"
        this.rndType = elem.getAttribute("data-mathvar-rnd") ?? "none"
        this.varname =  elem.getAttribute("data-mathvar") || "?"

        this.echartType = elem.getAttribute('data-mathvar-echarttype') ?? undefined
        if(!VarProvider.echartType.has(this.echartType))
            this.echartType = undefined

        if(this.rndType == 'rnd'){
            container.style.width = '140px'
        }
        {
            let highlights_str = (elem.getAttribute("data-highlight") || "").split(",")
            for(let i=0;i<highlights_str.length;i++){
                let s = highlights_str[i]
                if(s != ""){
                    this.highlightValues.push(+s)
                }
            }
        }

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
            me.setClusterValueOrValue(value)
            me.callback()
            if(VarProvider.lastTouchedVarProvider == undefined || !(VarProvider.lastTouchedVarProvider.isLocked))
                VarProvider.lastTouchedVarProvider = me
        });
        clickOverlay.addEventListener("mouseup",function(){
            if(!me.drawStarted) me.start_draw();
            value_init = undefined
            if(need_trigger_mouse_click){
               me.rnd() 
            }
            need_trigger_mouse_click = true
            if(VarProvider.lastTouchedVarProvider == undefined || !(VarProvider.lastTouchedVarProvider.isLocked))
                VarProvider.lastTouchedVarProvider = me
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
            if(VarProvider.lastTouchedVarProvider == undefined || !(VarProvider.lastTouchedVarProvider.isLocked))
                VarProvider.lastTouchedVarProvider = me
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
                    me.setClusterValueOrValue(me.p2v(percent));
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
                if(VarProvider.lastTouchedVarProvider == undefined || !(VarProvider.lastTouchedVarProvider.isLocked))
                    VarProvider.lastTouchedVarProvider = me
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
            me.setClusterValueOrValue(vNum);
            me.callback()
            if(VarProvider.lastTouchedVarProvider == undefined || !(VarProvider.lastTouchedVarProvider.isLocked))
                VarProvider.lastTouchedVarProvider = me
        });

        this.lockBtn.addEventListener("click",()=>{
            if(!me.drawStarted) me.start_draw()

            if(this.isLocked){
                this.unlock()
            }else{
                if(VarProvider.lastTouchedVarProvider && VarProvider.lastTouchedVarProvider.isLocked){
                    VarProvider.lastTouchedVarProvider.unlock()
                }
                if(VarProvider.lastTouchedVarProvider != this){
                    VarProvider.lastTouchedVarProvider = this
                    me.callback()
                }
                this.lock()    

            }
        })

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

    getEchartType():string{
        if(this.echartType)
            return this.echartType
        if(this.intOnly)
            return 'bar'
        return 'line'
    }
    showHelp(){
        this.helpBtn.style.display = 'inline-block'
    }

    lock(){
        if(this.isLocked){
            return
        }
        this.isLocked = true
        if(this.lockBtn)
            this.lockBtn.innerHTML = '<i class="fa fa-lock"></i>'
    }
    unlock(){
        if(!this.isLocked){
            return
        }
        this.isLocked = false
        if(this.lockBtn)
            this.lockBtn.innerHTML = '<i class="fa fa-unlock"></i>'
    }

    hideLockBtn(){
        this.lockBtn.remove()
        this.lockBtn = undefined
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
                this.setClusterValueOrValue(0|(Math.random() * (this.high - this.low + 1) + this.low), true)
            }else{
                this.setClusterValueOrValue(Math.random() * (this.high - this.low) + this.low, true)
            }
            this.callback()
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
        let r = cut_value(v, false, true, true)
        return this.varname + '=' +  r;
    };

    setClusterValueOrValue(i:number, isRandomValue:boolean = false){
        if(!VarProviderCluster.instance.setValue(this.varname, i,isRandomValue))
            this.setValue(i, isRandomValue)
    }

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
                this.textElem.innerHTML = '<i class="fa fa-random mathver-random-highlight"></i>&nbsp;&nbsp;' + this.textElem.innerHTML;
            }
            else {
                this.textElem.innerHTML = '<i class="fa fa-random mathver-random-default"></i>&nbsp;&nbsp;' + this.textElem.innerHTML;
            }
        }
        MathJaxHelper.updateMathJax([this.textElem])
    }

    getAlighedValue(){
        if(this.intOnly){
            return Math.round(this.value / this.intScale) * this.intScale
        }else{
            return this.value
        }

    }

    updateContext(){
        ExprContext.ctx.set(this.varname, this.getAlighedValue())
    }

    forEachValues(func:(v:number)=>void, step = 200){
        if(this.intOnly){
            for(let i=Math.ceil(this.low / this.intScale); i<=Math.floor(this.high / this.intScale);i+=1){
                func(i * this.intScale)
            }
        }else{
            for(let i=0;i<step;i++){
                func(this.p2v(i/(step-1)))
            }
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
if(varproviders.length > 0)
    varproviders[0].showHelp()

for(let i=0;i<varproviders.length;i++){
    VarProviderCluster.instance.register(varproviders[i])
}

let maths = document.getElementsByTagName("math")
let factory = new ExprFactory()

let exprs:Array<Expr> = []
let followers :Array<Follower> = []

let front_zIndex = 300
function updateFrontFollower(follower:Follower){
    if(follower.getZIndex() == front_zIndex)
        return
    // for(let i=0;i<followers.length;i++){
    //     followers[i].setZIndex(front_zIndex)
    // }
    follower.setZIndex(++front_zIndex)
}

function isAllFollowersHide(){
    for(var i=0;i<followers.length;i++)
        if(!followers[i].isHide())
            return false
    return true
}

class WikiMathExpressionProperty{
    show_result:boolean
    show_percent:boolean
    ttl:number|undefined = undefined
    name:string|undefined = undefined
    to:string|undefined = undefined
    is_katex = false
}
let props:Array<WikiMathExpressionProperty> = []

function need_calc_math(elem:Element, prop:WikiMathExpressionProperty){
    while(elem.tagName == "math" || elem.tagName.indexOf("mjx-")>=0  || elem.tagName.indexOf("MJX-")>=0){
        if(elem.parentElement){
            elem = elem.parentElement
        }else{
            break
        }
    }

    let is_katex = false
    while(elem && elem.classList.contains("katex-mathml") || elem.classList.contains("katex")){
        elem = elem.parentElement
        is_katex = true
    }
    if(is_katex && elem && !elem.hasAttribute("data-calc"))
        elem = elem.parentElement

    if(elem?.hasAttribute("data-calc") ?? false){
        if(elem.getAttribute("data-calc") == "1"){
            prop.is_katex = is_katex
            prop.show_result = (elem.getAttribute("data-showresult") || "1") == "1"
            prop.show_percent = (elem.getAttribute("data-percent") || "0") == "1"
            prop.name = elem.getAttribute("data-name") || undefined
            prop.to = elem.getAttribute("data-to") || undefined
            prop.ttl = +(elem.getAttribute("data-ttl") || "1")
            if(!isFinite(prop.ttl))
                prop.ttl = 1
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
        let mathMLElem:Element = maths[m]
        if(prop.is_katex && mathMLElem.children.length == 1 && mathMLElem.children[0].tagName == 'semantics'){
            let sem = mathMLElem.children[0]
            if(sem.children.length == 2 && sem.children[1].tagName == 'annotation')
                mathMLElem = sem.children[0]
        }
        let e = factory.fromMathML(mathMLElem)
        exprs.push(e)
        let follower
        if(prop.show_result){
            follower = new ElementFollower(maths[m])
        }else{
            follower = new Follower()
        }
        followers.push(follower)
        props.push(prop)
        follower.prop = prop

        //fix expr
        if(prop.ttl > 1){
            function fix(e:Expr){
                let assign = e.toAssignExpr()
                if(assign){
                    assign.canBeCmp = false
                }
                let select = e.toSelectExpr()
                if(select){
                    for(let i=0;i<select.items.length;i++){
                        //don't fix the condition
                        fix(select.items[i].value)
                    }
                }else{
                    e.visit(fix)
                }
            }
            fix(e)
        }

        console.log("已解析公式：", e.toString(), e)
    }catch(e){
        console.log("以下公式没有被解析，因为",e,maths[m])
    }
}
console.log("公式计算器共成功解析" + exprs.length + "个公式")

{
    //处理prop.name和prop.to，把图像从一个地方合并到另一个地方
    let followerNameMap = new Map<string, ElementFollower>()
    for(let i=0;i<followers.length;i++){
        if(props[i].name!=undefined){
            let follower = followers[i].toElementFollower()
            if(follower){
                followerNameMap.set(props[i].name, follower)
            }
        }
    }
    for(let i=0;i<followers.length;i++){
        if(props[i].to != undefined && followerNameMap.has(props[i].to)){
            let follower = followers[i].toElementFollower()
            if(follower){
                follower.echartsMergeTo = followerNameMap.get(props[i].to)
            }
        }
    }
}

let cut_value_re = new RegExp("^-?[0-9\\.]+$")
let replace_e = new RegExp("(\\.[0-9]*?)0+e")
function cut_value(value:number, show_percent:boolean, cut_tail_zero /* 全部按照cut处理 */= false, in_mathjax /* 在mathjax上下文中，百分号需要转义 */ = false):string{
    /* 这个函数用于将value转换为string */
    let tail_txt = ""
    if(show_percent){
        if(in_mathjax)
            tail_txt = "\\%"
        else
            tail_txt = "%"
        value = value * 100
    }

    if(Math.abs(value - (value | 0)) < 0.00000001){
        //确认是整数，而且小于2的32次方
        if(Math.abs(value) < 100000)
            return value.toFixed(0) + tail_txt
        return value.toExponential(2).replace("e+","e").replace(replace_e,"$1e").replace(".e","e") + tail_txt
    }

    if(Math.abs(value) >= 100000){
        // 100000+ 输出 1.23e4这样的数字
        return value.toExponential(2).replace("e+","e").replace(replace_e,"$1e").replace(".e","e") + tail_txt
    }

    if(Math.abs(value) >= 1){
        // 1 ~ 100000 保留两位小数
        let ret = value.toFixed(2)
        return ret + tail_txt
        // let tail = ret.length
        // while(ret[tail-1] == '0')
        //     tail--
        // if(ret[tail-1]=='.')
        //     tail--
        // return ret.substring(0, tail) + tail_txt
    }
    if(Math.abs(value) >= 0.0001){
        // 0.0001 ~ 1 保留4位小数
        let ret = value.toFixed(4)
        return ret + tail_txt
        // let tail = ret.length
        // while(ret[tail-1] == '0')
        //     tail--
        // if(ret[tail-1]=='.')
        //     tail--
        // return ret.substring(0, tail) + tail_txt
    }
    // 剩下的...太小了，随便吧
    return value.toExponential(4).replace("e+","e").replace(replace_e,"$1e").replace(".e","e") + tail_txt
}
function calculate(){
    if(exprs.length == 0){
        console.log("公式列表为空，无可计算公式")
        return
    }
    let need_display_followers = isAllFollowersHide()

    ExprContext.ctx.reset()
    for(let i=0;i<varproviders.length;i++){
        varproviders[i].updateContext()
    }
    let expr_ttl = []
    for(let i=0;i<exprs.length;i++){
        if(props[i].ttl == undefined){
            expr_ttl[i] = 1
        }else{
            expr_ttl[i] = props[i].ttl
        }
    }
    for(let i=0;i<100;i++){
        let someexpr_changed = false
        for(let m=0;m<exprs.length;m++){
            ExprContext.ctx.changed = false
            if(expr_ttl[m] <= 0)
                continue
            if(exprs[m].hasResult()){
                let updated_vars = ""
                ExprContext.ctx.changedCallback = (name,value,changed)=>{

                    if(updated_vars.length > 0) updated_vars += "\n"
                    updated_vars += "\\(" + name + "=" + cut_value(value, props[m].show_percent, true, true) + "\\)"
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
                        updated_vars += "✔️成立"
                    }else{
                        updated_vars += "❌不成立"
                    }
                }
                // show ans
                if(updated_vars.length == 0){
                    updated_vars = "\\(ans=" + cut_value(result, props[m].show_percent, true, true) + "\\)"
                }
                // if(updated_vars.length > 0) updated_vars += "\n"
                // updated_vars += "\\(ans=" + result + "\\)"
                if(displayDebugMessage())
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

                if(ExprContext.ctx.changed){
                    someexpr_changed = true
                    expr_ttl[m]--
                }
            }
        }
        if(!someexpr_changed){
            if(displayDebugMessage())
                console.log("没有值被更新，迭代终止")
            break
        }
    }
    if(ExprContext.ctx.changed){
        console.error("公式结果未收敛")
    }
}

function calculateEcharts(){
    if(VarProvider.lastTouchedVarProvider == undefined)
        return;

    {
        let need_calculate_echart = false
        for(let i=0;i<followers.length;i++){
            if(followers[i].needCalculateEchart()){
                need_calculate_echart = true
                break
            }
        }
        if(!need_calculate_echart)
            return;
    }

    for(let i=0;i<followers.length;i++){
        let e = followers[i].echartsData
        if(e)
            e.reset(VarProvider.lastTouchedVarProvider.varname)
    }

    let idx = 0

    let recordValue = (v:number, idx:number)=>{
        //calculate every things
        ExprContext.ctx.reset()
        for(let i=0;i<varproviders.length;i++){
            varproviders[i].updateContext()
        }
        ExprContext.ctx.set(VarProvider.lastTouchedVarProvider.varname, v)

        let expr_ttl = []
        for(let i=0;i<props.length;i++){
            if(props[i].ttl != undefined){
                expr_ttl[i] = props[i].ttl
            }else{
                expr_ttl[i] = 1
            }
        }
        for(let i=0;i<100;i++){
            let someexpr_changed = false
            for(let m=0;m<exprs.length;m++){
                if(expr_ttl[m]<=0)
                    continue
                ExprContext.ctx.changed = false
                if(exprs[m].hasResult()){
                    let echartData = followers[m].echartsData
                    let save_additional_data = true
                    {
                        //如果当前的follower将数据送给了别人，就更新别人的echartData，不要更新自己的echartData
                        let elemFollower = followers[m].toElementFollower()
                        if(elemFollower && elemFollower.echartsMergeTo){
                            echartData = elemFollower.echartsMergeTo.echartsData
                            save_additional_data = false
                            if(!elemFollower.echartsMergeTo.needEchartsData())
                                echartData = undefined
                        }else{
                            //如果自己的echart没有显示，那就没有必要记录数据
                            if(!followers[m].needEchartsData())
                                echartData = undefined
                        }
                    }
                    if(echartData){
                        echartData.x[idx] = v
                    }

                    let setY = (name:string, value:number)=>{
                        if(echartData == undefined)
                            return
                        if(!echartData.y.has(name))
                            echartData.y.set(name, new EchartsYData())
                        echartData.y.get(name).value[idx] = value
                    }
                    ExprContext.ctx.changedCallback = (name,value,changed)=>{
                        if(changed != VarUpdateType.NOT_CHANGED)
                        setY(name,value)
                    }
    
                    let compare_result : boolean | undefined = undefined
                    ExprContext.ctx.compareResultCallback = (expr,result)=>{
                        if(expr.cmpResult != undefined){
                            if(compare_result == undefined || compare_result){
                                compare_result = expr.cmpResult
                            }
                        }
                    }

                    let ans = exprs[m].result()
                    if(save_additional_data){
                        if(compare_result != undefined){
                            setY("cmp", compare_result ? 1 : 0)
                        }
                        setY("ans", ans)    
                    }

                    ExprContext.ctx.changedCallback = ()=>{}
                    ExprContext.ctx.compareResultCallback = ()=>{}

                    if(ExprContext.ctx.changed){
                        someexpr_changed = true
                        expr_ttl[m]--
                    }
                }
            }
            if(!someexpr_changed){
                break
            }
        }


    }

    VarProvider.lastTouchedVarProvider.forEachValues((v)=>{
        recordValue(v, idx++)
    })

    //we need highlight the last variable in echarts
    recordValue(VarProvider.lastTouchedVarProvider.getAlighedValue(), -1)
    for(let i=0;i<VarProvider.lastTouchedVarProvider.highlightValues.length;i++){
        recordValue(VarProvider.lastTouchedVarProvider.highlightValues[i], -2 - i)
    }

    for(let i=0;i<followers.length;i++){
        let e = followers[i].echartsData
        if(e){
            e.data_count = idx
        }
        followers[i].updateEcharts()
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

{
    let usefulFollowerCount = 0
    for(let i=0;i<followers.length;i++){
        if(followers[i].isUsefulFollower())
            usefulFollowerCount++
    }
    if(usefulFollowerCount == 1){
        for(let i=0;i<followers.length;i++){
            followers[i].removeHideAllBtn()
        }
    }
}
if(followers.length > 0){
    window.addEventListener("resize", function(){
        for(let i=0;i<followers.length;i++){
            followers[i].follow()
        }
    })    
}

if(varproviders.length == 1){
    varproviders[0].hideLockBtn()
}

// calculate()