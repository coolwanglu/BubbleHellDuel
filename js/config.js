/*
 * config.js
 * Copyright (C) 2014 Lu Wang <coolwanglu@gmail.com>
 */
var Config = {
    key_mapping: {
        keyboard: {
            move_left: [KeyEvent.DOM_VK_LEFT],
            move_right: [KeyEvent.DOM_VK_RIGHT],
            move_up: [KeyEvent.DOM_VK_UP],
            move_down: [KeyEvent.DOM_VK_DOWN],
            action: [KeyEvent.DOM_VK_SHIFT],
        },
        /* array for axes, number for buttons */
        gamepad: {
            move_left: [[0, -0.5], 14],
            move_right: [[0, 0.5], 15],
            move_up: [[1, -0.5], 12],
            move_down: [[1, 0.5], 13],
            action: [0, 2],
        }
    }
};