$ = require "core.js"
b = require "nbuild"

build = (callback) ->
  $.parallel [
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


task "sbuild", -> build(->)
task "build", -> build(->)