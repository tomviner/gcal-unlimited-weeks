// Written in ECMAScript 6

function poll_custom_button_visibility(wait_ms=500) {
    let button = custom_view()
    console.log('poll_custom_button_visibility', button)
    if (button.is(":visible")) {
        $(document).trigger("custom_view_buttons_visible")
    } else {
        setTimeout(poll_custom_button_visibility, wait_ms)
    }
  }

function inject_buttons(){
    num_weeks = $('.month-row').length
    let button = custom_view()
    button.after(
        function(){
            return $(this).clone().removeClass('goog-imageless-button-checked').text('-').click(dec_week)
        }
    ).after(
        function(){
            return $(this).clone().removeClass('goog-imageless-button-checked').text('+').click(inc_week)
        }
    )
}

function trigger(event_names, elem){
    // event_names: space sep names of events
    // elem: jQuery element
    if (!event_names || event_names.length === 0) {
        console.log(elem)
        throw(`Cannot trigger ${event_names}, element event_names`)
    }
    if (!elem || elem.length === 0) {
        console.log(elem)
        throw(`Cannot trigger ${event_names}, element missing`)
    }
    for (let event_name of event_names.split(' ')) {
        let evt = document.createEvent("MouseEvents")
        evt.initMouseEvent(event_name, true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
        let dom_elem = elem.get(0)
        dom_elem.dispatchEvent(evt)
    }
    return elem
}

// let start = () => $('.dp-cell[class*="dp-o"]').eq(0)
// let end = (n) => $('.dp-cell').eq(n || 52)
let month_view = () => $('#topRightNavigation .goog-imageless-button').eq(2)
let custom_view = () => $('#topRightNavigation .goog-imageless-button').eq(3)
let prev_month = () => $('.navBack').eq(0)
let today = () => $('#todayButton\\:1,#todayButton\\:2').children().eq(0)
let next_month = () => $('#dp_0_next')
// let selected = () => $('.dp-cell[class*="-selected"]')
// let extract_day_num = (el) => parseInt(el.eq(0).attr('id').split('_').slice(-1)[0])
// // days since 1st Nov 1950?
// selected_day_num = () => extract_day_num(selected())

// mini_cal_first_day_num = () => extract_day_num(start())
// mini_cal_last_day_num = () => extract_day_num(end())

class BigCal {
    get first_day_num () {
        return parseInt(
            $('#gridcontainer span[class^="ca-cdp"]')
                .attr('class')
                .split('ca-cdp')
                .slice(-1)[0]
        )
    }
}

class MiniCal {
    get cells () {return $('.dp-cell[class*="dp-o"]')}
    nth (n) {return this.cells.eq(n)}
    get first () {return this.nth(0)}
    get first_day_num () {return this.extract_day_num(this.first)}
    get last () {return this.nth(7 * 6 - 1)}
    get last_day_num () {return this.extract_day_num(this.last)}
    get month_start_indexs () {return this.cells.map((i, el) => {
            if ($(el).text() === '1'){
                return i
            } else {
                return null
            }
        })
    }
    get month_start_cells () {return this.cells.map((i, el) => {
            if ($(el).text() === '1'){
                return $(el)
            } else {
                return null
            }
        })
    }
    get month_starts_high () {return this.month_start_indexs[0] < 7}
    get month_ends_low () {return this.month_start_indexs[1] >= 7 * 5}
    get weeks_in_month () {
        // bools get cast to 0 or 1 here. each true is an extra week
        return 3 + this.month_starts_high + this.month_ends_low
    }
    get selected () {return this.cells.filter('[class*="-selected"]')}
    cell_from_day_num (day_num) {return this.cells.filter(`[id$="${day_num}"]`)}
    extract_day_num (el) {return parseInt(el.eq(0).attr('id').split('_').slice(-1)[0])}
    month_backward () {trigger('mousedown mouseup', $('.dp-sb-prev'))}
    month_forward () {trigger('mousedown mouseup', $('.dp-sb-next'))}
    navigate_to (day_num) {
        let i = 0
        // console.log('looking for', day_num, this.cell_from_day_num(day_num))
        while (day_num < this.first_day_num || this.last_day_num < day_num){
            // console.log(this.first_day_num, day_num, this.last_day_num)
            if (++i > 10){
                throw "Too many loops"
            }
            if (day_num < this.first_day_num){
                this.month_backward()
            } else if (this.last_day_num < day_num){
                this.month_forward()
            } else {
                throw 'unknown condition'
            }
        }
        if (this.cell_from_day_num(day_num).length != 1){
            throw "target not found on mini cal"
        }
    }
}

function set_range(weeks_left){
    // console.log('set_range', months, weeks)

    let weeks_wanted = weeks_left
    let target_start_day_num = big_cal.first_day_num
    console.log(`start on day num ${target_start_day_num}`)

    // get calandar into known state
    // go back a couple of months
    prev_month().click()
    prev_month().click()
    // slide range to start today
    trigger('click', today())
    // move to month view, click doesn't work here
    trigger('mousedown mouseup', custom_view())

    mini_cal.navigate_to(target_start_day_num)
    console.log(`start on day ${mini_cal.nth(mini_cal.month_start_indexs[0]+7).text()}`, mini_cal.nth(mini_cal.month_start_indexs[0]+7))

    // do a double manoeuvre: click next month during a click drag over the mini calendar.
    // this is how we reach more than one month
    trigger('mousedown', mini_cal.nth(mini_cal.month_start_indexs[0]+7))
    let days = 0
    let i = -1
    while (weeks_left > 0) {
        i++
        console.log(`${weeks_left} weeks left,`)
        let weeks_in_month = mini_cal.weeks_in_month
        if (weeks_in_month > weeks_left){
            console.log(`    < ${weeks_in_month} months - no full months left`)
            break
        }
        weeks_left -= weeks_in_month
        console.log(`    - ${weeks_in_month} weeks_in_month`)
        mini_cal.month_forward()
    }
    if (weeks_left === 0){
        console.log(`    = exactly no weeks_left`)
    }
    else if (weeks_left < 0) {
        throw `Didn't expect ${weeks_left} weeks_left`
    } else if (weeks_left > 0) {
        days = 7 * weeks_left
        console.log(`    + ${days} days left`)
    }
    console.log(`days = ${days}`)
    console.log(`days += ${mini_cal.month_start_indexs[0]} mini_cal.month_start_indexs[0]`)
    days += mini_cal.month_start_indexs[0]

    console.log(`stop on day ${mini_cal.nth(days).text()}`, mini_cal.nth(days))
    trigger('mousemove mouseup', mini_cal.nth(days))
    trigger('mouseup', mini_cal.nth(days))

    let weeks_got = $('.month-row').length
    custom_view().find('.goog-imageless-button-content').text(`${weeks_got} weeks`)

    // now move the calandar back to the date it started at
    console.log('return to selected day', target_start_day_num)

    // move active range forward, out the way
    mini_cal.month_forward()
    // we must click outside the active range, otherwise, we just select a single day
    trigger('mousedown mouseup', mini_cal.last)

    // now click the date we want, in the mini map
    mini_cal.navigate_to(target_start_day_num)
    trigger('mousedown mouseup', mini_cal.cell_from_day_num(target_start_day_num))


}

function set_weeks(weeks){
    let weeks_before = $('.month-row').length
    set_range(weeks)
    let weeks_after = $('.month-row').length
    console.log(`set_weeks(${weeks}) --> set_range(${weeks})`)
    console.log(`got ${weeks_before} -->${weeks_after} (${weeks - weeks_after})`)
    console.log('---')
}

function inc_week(){
    set_weeks(++num_weeks)
}

function dec_week(){
    set_weeks(--num_weeks)
}

let num_weeks
let mini_cal = new MiniCal()
let big_cal = new BigCal()

$(document).ready(
    function(){
        // triggers custom_view_buttons_visible event
        poll_custom_button_visibility()
    })

$(document)
    .on("custom_view_buttons_visible", inject_buttons)

// $(document)
//     .on("custom_view_buttons_visible", function(){
//         inject_buttons()
//         // demo
//         setTimeout(inc_week, 1000)
//         setTimeout(inc_week, 1500)
//         setTimeout(dec_week, 3000)
//     })
