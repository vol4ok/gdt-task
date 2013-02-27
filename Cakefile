$ = require "core.js"
$.ext require "child_process"

b = require "nbuild"

build = (callback) ->
  $.parallel [
    (cb) -> b.ff_coffee "script/test.coffee", "test/test.js", {bare:yes}, cb
    (cb) -> 
      $.chain [
        (fn) -> b.fs_coffee "script/gdt.coffee", {bare:yes}, fn
        (err, str) -> b.sf_js str, "gdt.js", {}, cb
          # $.parallel [
          #   (fn) -> b.sf_js str, "gdt.min.js", {compress: yes}, fn
          #   (fn) -> b.sf_js str, "gdt.js", {}, fn
          # ], cb
        ], cb
    (cb) -> b.ff_stylus "style/gdt.styl", "gdt.css", {compress: yes, paths: ["style/lib"]}, cb
  ], (err, results) ->
    return err if err
    console.log "OK!"
    callback()

test = (callback) ->
   proc = $.spawn('mocha-phantomjs', ['test/test.html'])
   proc.stdout.on 'data', (data) -> process.stdout.write(data)
   proc.on 'exit', (code) -> callback(code)

task "sbuild", -> build(->)
task "build", -> build(->)
task "test", -> test(->)