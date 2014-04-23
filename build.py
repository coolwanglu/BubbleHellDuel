#!/usr/bin/env python

import os

prefix='./'
js_list = [
	'js/const.js',
	'js/config.js',
	'js/util.js',
	'js/bullet.js',
	'js/input.js',
	'js/op.js',
	'js/interpreter.js',
	'js/director.js',
	'js/debug_hud.js',
    'js/player.js',
	'js/arena.js',
	'js/game.js'
]

with open('wlgame.js','w') as outf:
    outf.write('(function(){')
    
    for fn in js_list:
        outf.write(open(prefix + fn).read())
    
    outf.write('})();')


os.system('java -jar closure-compiler/compiler.jar --language_in ECMASCRIPT5 --js wlgame.js --js_output_file wlgame.min.js')
