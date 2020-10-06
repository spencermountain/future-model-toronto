
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.24.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    var data = [
      // green
      { name: 'The One', x: 934, height: 996, construction: true },
      { name: 'YSL Reisdences', x: 1933, height: 299, construction: true },
      { name: 'Sky Tower', x: 1927, height: 313, construction: true },
      { name: 'Canada House', x: 3860, height: 230, construction: true },
      { name: 'Rosedale on Bloor', x: 366, height: 186, construction: true },
      // blue
      { name: '625 Church', x: 851, height: 202, construction: false },
      { name: '1 Scollard', x: 797, height: 155, construction: false },
      { name: 'Cumberland Square', x: 1047, height: 238, construction: false },
      { name: '1200 Bay', x: 918, height: 324, construction: false },
      { name: 'Chelsea Green', x: 1970, height: 276, construction: false },
      { name: '11 Bay', x: 3322, height: 270, construction: false },
      { name: 'The Hub', x: 3377, height: 304, construction: false },
      { name: 'Mirvish+Gehry', x: 3218, height: 329, construction: false },
      { name: 'Union Park', x: 3663, height: 303, construction: false }
    ];

    /* Demo.svelte generated by Svelte v3.24.1 */
    const file = "Demo.svelte";

    function add_css() {
    	var style = element("style");
    	style.id = "svelte-v0cvyv-style";
    	style.textContent = ".container.svelte-v0cvyv{position:relative;min-height:100vh;max-height:100vh;height:100%}.col.svelte-v0cvyv{display:flex;flex-direction:column;justify-content:space-between;align-items:center;text-align:center;flex-wrap:nowrap;align-self:stretch}body{background-color:#c7c8ca;min-height:100%;margin:0px}#imgbox.svelte-v0cvyv{position:relative;width:100%;max-width:100%;overflow:hidden;height:520px;min-height:520px;border:1px solid grey}#slider.svelte-v0cvyv{position:absolute;top:-180px;border:1px solid grey;position:absolute;left:-2500px;z-index:1}.dir.svelte-v0cvyv{position:absolute;font-size:25px;top:10px;z-index:5;color:#50617a}#label.svelte-v0cvyv{position:absolute;left:30%;width:40%;text-align:center;font-size:25px;top:10px;z-index:5;color:#50617a}.title.svelte-v0cvyv{font-size:1rem;color:#50617a;text-align:left;align-self:flex-start;margin-left:15px;font-size:0.9rem}#timeline.svelte-v0cvyv{flex:1;width:100%;border:1px solid grey;overflow-y:scroll;overflow-x:hidden}#arrow.svelte-v0cvyv{position:absolute;left:50%;height:40px;width:2px;background-color:#50617a;top:60px;z-index:5}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGVtby5zdmVsdGUiLCJzb3VyY2VzIjpbIkRlbW8uc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQ+XG4gIGltcG9ydCBkYXRhIGZyb20gJy4vZGF0YSdcbjwvc2NyaXB0PlxuXG48c3R5bGU+XG4gIC5jb250YWluZXIge1xuICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgICBtaW4taGVpZ2h0OiAxMDB2aDtcbiAgICBtYXgtaGVpZ2h0OiAxMDB2aDtcbiAgICBoZWlnaHQ6IDEwMCU7XG4gIH1cbiAgLmNvbCB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICBmbGV4LXdyYXA6IG5vd3JhcDtcbiAgICBhbGlnbi1zZWxmOiBzdHJldGNoO1xuICB9XG5cbiAgOmdsb2JhbChib2R5KSB7XG4gICAgYmFja2dyb3VuZC1jb2xvcjogI2M3YzhjYTtcbiAgICBtaW4taGVpZ2h0OiAxMDAlO1xuICAgIG1hcmdpbjogMHB4O1xuICB9XG4gICNpbWdib3gge1xuICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgICB3aWR0aDogMTAwJTtcbiAgICBtYXgtd2lkdGg6IDEwMCU7XG4gICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICBoZWlnaHQ6IDUyMHB4O1xuICAgIG1pbi1oZWlnaHQ6IDUyMHB4O1xuICAgIGJvcmRlcjogMXB4IHNvbGlkIGdyZXk7XG4gIH1cbiAgI3NsaWRlciB7XG4gICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgIHRvcDogLTE4MHB4O1xuICAgIGJvcmRlcjogMXB4IHNvbGlkIGdyZXk7XG4gICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgIGxlZnQ6IC0yNTAwcHg7XG4gICAgei1pbmRleDogMTtcbiAgfVxuICAuZGlyIHtcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgZm9udC1zaXplOiAyNXB4O1xuICAgIHRvcDogMTBweDtcbiAgICB6LWluZGV4OiA1O1xuICAgIGNvbG9yOiAjNTA2MTdhO1xuICB9XG4gICNsYWJlbCB7XG4gICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgIGxlZnQ6IDMwJTtcbiAgICB3aWR0aDogNDAlO1xuICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICBmb250LXNpemU6IDI1cHg7XG4gICAgdG9wOiAxMHB4O1xuICAgIHotaW5kZXg6IDU7XG4gICAgY29sb3I6ICM1MDYxN2E7XG4gIH1cbiAgLnRpdGxlIHtcbiAgICBmb250LXNpemU6IDFyZW07XG4gICAgY29sb3I6ICM1MDYxN2E7XG4gICAgdGV4dC1hbGlnbjogbGVmdDtcbiAgICBhbGlnbi1zZWxmOiBmbGV4LXN0YXJ0O1xuICAgIG1hcmdpbi1sZWZ0OiAxNXB4O1xuICAgIGZvbnQtc2l6ZTogMC45cmVtO1xuICAgIC8qIGZvbnQtZmFtaWx5OiB0aW1lcyBuZXcgcm9tYW47ICovXG4gIH1cbiAgI3RpbWVsaW5lIHtcbiAgICBmbGV4OiAxO1xuICAgIHdpZHRoOiAxMDAlO1xuICAgIGJvcmRlcjogMXB4IHNvbGlkIGdyZXk7XG4gICAgb3ZlcmZsb3cteTogc2Nyb2xsO1xuICAgIG92ZXJmbG93LXg6IGhpZGRlbjtcbiAgfVxuICAjYXJyb3cge1xuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICBsZWZ0OiA1MCU7XG4gICAgaGVpZ2h0OiA0MHB4O1xuICAgIHdpZHRoOiAycHg7XG4gICAgYmFja2dyb3VuZC1jb2xvcjogIzUwNjE3YTtcbiAgICB0b3A6IDYwcHg7XG4gICAgei1pbmRleDogNTtcbiAgfVxuPC9zdHlsZT5cblxuPGRpdiBjbGFzcz1cImNvbnRhaW5lciBjb2xcIj5cblxuICA8ZGl2IGNsYXNzPVwidGl0bGVcIj5cbiAgICBUb3JvbnRvIGNvbnRzdHJ1Y3Rpb24gdGltZWxpbmUgLSBwcm9vZiBvZiBjb25jZXB0IGZvclxuICAgIDxhIGhyZWY9XCJodHRwczovL3d3dy5zdGVwaGVudmVsYXNjby5jb20vXCI+c3RlcGhlbiB2ZWxhc2NvPC9hPlxuICA8L2Rpdj5cblxuICA8ZGl2IGlkPVwidGltZWxpbmVcIj5cbiAgICB7I2VhY2ggZGF0YSBhcyBvYmp9XG4gICAgICA8ZGl2IHN0eWxlPVwibWFyZ2luLXRvcDo0MHB4O1wiPntvYmoubmFtZX08L2Rpdj5cbiAgICB7L2VhY2h9XG4gIDwvZGl2PlxuXG4gIDxkaXYgaWQ9XCJpbWdib3hcIj5cbiAgICA8ZGl2IGlkPVwibGFiZWxcIj5Ub3JvbnRvIENpdHkgSGFsbDwvZGl2PlxuICAgIDxkaXYgaWQ9XCJhcnJvd1wiIC8+XG4gICAgPGRpdiBjbGFzcz1cImRpclwiIHN0eWxlPVwibGVmdDoyMHB4O1wiPuKtoE48L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwiZGlyXCIgc3R5bGU9XCJyaWdodDoyMHB4O1wiPlPiraI8L2Rpdj5cbiAgICA8ZGl2IGlkPVwic2xpZGVyXCI+XG4gICAgICA8aW1nIHN0eWxlPVwibWluLXdpZHRoOjUwMDBweDtcIiBzcmM9XCIuL2Fzc2V0cy9mcm9tLXdlc3QuanBlZ1wiIGFsdD1cIlwiIC8+XG4gICAgPC9kaXY+XG4gIDwvZGl2PlxuICA8IS0tIDxpbWcgc3R5bGU9XCJtaW4td2lkdGg6NTAwMHB4O1wiIHNyYz1cIi4vYXNzZXRzL2Zyb20td2VzdC5qcGVnXCIgYWx0PVwiXCIgLz4gLS0+XG48L2Rpdj5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFLRSxVQUFVLGNBQUMsQ0FBQyxBQUNWLFFBQVEsQ0FBRSxRQUFRLENBQ2xCLFVBQVUsQ0FBRSxLQUFLLENBQ2pCLFVBQVUsQ0FBRSxLQUFLLENBQ2pCLE1BQU0sQ0FBRSxJQUFJLEFBQ2QsQ0FBQyxBQUNELElBQUksY0FBQyxDQUFDLEFBQ0osT0FBTyxDQUFFLElBQUksQ0FDYixjQUFjLENBQUUsTUFBTSxDQUN0QixlQUFlLENBQUUsYUFBYSxDQUM5QixXQUFXLENBQUUsTUFBTSxDQUNuQixVQUFVLENBQUUsTUFBTSxDQUNsQixTQUFTLENBQUUsTUFBTSxDQUNqQixVQUFVLENBQUUsT0FBTyxBQUNyQixDQUFDLEFBRU8sSUFBSSxBQUFFLENBQUMsQUFDYixnQkFBZ0IsQ0FBRSxPQUFPLENBQ3pCLFVBQVUsQ0FBRSxJQUFJLENBQ2hCLE1BQU0sQ0FBRSxHQUFHLEFBQ2IsQ0FBQyxBQUNELE9BQU8sY0FBQyxDQUFDLEFBQ1AsUUFBUSxDQUFFLFFBQVEsQ0FDbEIsS0FBSyxDQUFFLElBQUksQ0FDWCxTQUFTLENBQUUsSUFBSSxDQUNmLFFBQVEsQ0FBRSxNQUFNLENBQ2hCLE1BQU0sQ0FBRSxLQUFLLENBQ2IsVUFBVSxDQUFFLEtBQUssQ0FDakIsTUFBTSxDQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxBQUN4QixDQUFDLEFBQ0QsT0FBTyxjQUFDLENBQUMsQUFDUCxRQUFRLENBQUUsUUFBUSxDQUNsQixHQUFHLENBQUUsTUFBTSxDQUNYLE1BQU0sQ0FBRSxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FDdEIsUUFBUSxDQUFFLFFBQVEsQ0FDbEIsSUFBSSxDQUFFLE9BQU8sQ0FDYixPQUFPLENBQUUsQ0FBQyxBQUNaLENBQUMsQUFDRCxJQUFJLGNBQUMsQ0FBQyxBQUNKLFFBQVEsQ0FBRSxRQUFRLENBQ2xCLFNBQVMsQ0FBRSxJQUFJLENBQ2YsR0FBRyxDQUFFLElBQUksQ0FDVCxPQUFPLENBQUUsQ0FBQyxDQUNWLEtBQUssQ0FBRSxPQUFPLEFBQ2hCLENBQUMsQUFDRCxNQUFNLGNBQUMsQ0FBQyxBQUNOLFFBQVEsQ0FBRSxRQUFRLENBQ2xCLElBQUksQ0FBRSxHQUFHLENBQ1QsS0FBSyxDQUFFLEdBQUcsQ0FDVixVQUFVLENBQUUsTUFBTSxDQUNsQixTQUFTLENBQUUsSUFBSSxDQUNmLEdBQUcsQ0FBRSxJQUFJLENBQ1QsT0FBTyxDQUFFLENBQUMsQ0FDVixLQUFLLENBQUUsT0FBTyxBQUNoQixDQUFDLEFBQ0QsTUFBTSxjQUFDLENBQUMsQUFDTixTQUFTLENBQUUsSUFBSSxDQUNmLEtBQUssQ0FBRSxPQUFPLENBQ2QsVUFBVSxDQUFFLElBQUksQ0FDaEIsVUFBVSxDQUFFLFVBQVUsQ0FDdEIsV0FBVyxDQUFFLElBQUksQ0FDakIsU0FBUyxDQUFFLE1BQU0sQUFFbkIsQ0FBQyxBQUNELFNBQVMsY0FBQyxDQUFDLEFBQ1QsSUFBSSxDQUFFLENBQUMsQ0FDUCxLQUFLLENBQUUsSUFBSSxDQUNYLE1BQU0sQ0FBRSxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FDdEIsVUFBVSxDQUFFLE1BQU0sQ0FDbEIsVUFBVSxDQUFFLE1BQU0sQUFDcEIsQ0FBQyxBQUNELE1BQU0sY0FBQyxDQUFDLEFBQ04sUUFBUSxDQUFFLFFBQVEsQ0FDbEIsSUFBSSxDQUFFLEdBQUcsQ0FDVCxNQUFNLENBQUUsSUFBSSxDQUNaLEtBQUssQ0FBRSxHQUFHLENBQ1YsZ0JBQWdCLENBQUUsT0FBTyxDQUN6QixHQUFHLENBQUUsSUFBSSxDQUNULE9BQU8sQ0FBRSxDQUFDLEFBQ1osQ0FBQyJ9 */";
    	append_dev(document.head, style);
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[0] = list[i];
    	return child_ctx;
    }

    // (96:4) {#each data as obj}
    function create_each_block(ctx) {
    	let div;
    	let t_value = /*obj*/ ctx[0].name + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			set_style(div, "margin-top", "40px");
    			add_location(div, file, 96, 6, 1751);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(96:4) {#each data as obj}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div8;
    	let div0;
    	let t0;
    	let a;
    	let t2;
    	let div1;
    	let t3;
    	let div7;
    	let div2;
    	let t5;
    	let div3;
    	let t6;
    	let div4;
    	let t8;
    	let div5;
    	let t10;
    	let div6;
    	let img;
    	let img_src_value;
    	let each_value = data;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div8 = element("div");
    			div0 = element("div");
    			t0 = text("Toronto contstruction timeline - proof of concept for\n    ");
    			a = element("a");
    			a.textContent = "stephen velasco";
    			t2 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t3 = space();
    			div7 = element("div");
    			div2 = element("div");
    			div2.textContent = "Toronto City Hall";
    			t5 = space();
    			div3 = element("div");
    			t6 = space();
    			div4 = element("div");
    			div4.textContent = "⭠N";
    			t8 = space();
    			div5 = element("div");
    			div5.textContent = "S⭢";
    			t10 = space();
    			div6 = element("div");
    			img = element("img");
    			attr_dev(a, "href", "https://www.stephenvelasco.com/");
    			add_location(a, file, 91, 4, 1627);
    			attr_dev(div0, "class", "title svelte-v0cvyv");
    			add_location(div0, file, 89, 2, 1545);
    			attr_dev(div1, "id", "timeline");
    			attr_dev(div1, "class", "svelte-v0cvyv");
    			add_location(div1, file, 94, 2, 1701);
    			attr_dev(div2, "id", "label");
    			attr_dev(div2, "class", "svelte-v0cvyv");
    			add_location(div2, file, 101, 4, 1844);
    			attr_dev(div3, "id", "arrow");
    			attr_dev(div3, "class", "svelte-v0cvyv");
    			add_location(div3, file, 102, 4, 1888);
    			attr_dev(div4, "class", "dir svelte-v0cvyv");
    			set_style(div4, "left", "20px");
    			add_location(div4, file, 103, 4, 1911);
    			attr_dev(div5, "class", "dir svelte-v0cvyv");
    			set_style(div5, "right", "20px");
    			add_location(div5, file, 104, 4, 1960);
    			set_style(img, "min-width", "5000px");
    			if (img.src !== (img_src_value = "./assets/from-west.jpeg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file, 106, 6, 2034);
    			attr_dev(div6, "id", "slider");
    			attr_dev(div6, "class", "svelte-v0cvyv");
    			add_location(div6, file, 105, 4, 2010);
    			attr_dev(div7, "id", "imgbox");
    			attr_dev(div7, "class", "svelte-v0cvyv");
    			add_location(div7, file, 100, 2, 1822);
    			attr_dev(div8, "class", "container col svelte-v0cvyv");
    			add_location(div8, file, 87, 0, 1514);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div0);
    			append_dev(div0, t0);
    			append_dev(div0, a);
    			append_dev(div8, t2);
    			append_dev(div8, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div8, t3);
    			append_dev(div8, div7);
    			append_dev(div7, div2);
    			append_dev(div7, t5);
    			append_dev(div7, div3);
    			append_dev(div7, t6);
    			append_dev(div7, div4);
    			append_dev(div7, t8);
    			append_dev(div7, div5);
    			append_dev(div7, t10);
    			append_dev(div7, div6);
    			append_dev(div6, img);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*data*/ 0) {
    				each_value = data;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div8);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Demo> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Demo", $$slots, []);
    	$$self.$capture_state = () => ({ data });
    	return [];
    }

    class Demo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		if (!document.getElementById("svelte-v0cvyv-style")) add_css();
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Demo",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    // wire-in query params
    // let user = ''
    // const URLSearchParams = window.URLSearchParams
    // if (typeof URLSearchParams !== undefined) {
    //   const urlParams = new URLSearchParams(window.location.search)
    //   const myParam = urlParams.get('user')
    //   if (myParam) {
    //     user = myParam
    //   }
    // }

    const app = new Demo({
      target: document.body
      // props: { user: user }
    });

    return app;

}());
