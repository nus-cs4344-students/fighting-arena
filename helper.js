/**
 *
 * Created by zchen on 17/4/15.
 */

'use strict';

function Helper() {
    var lobbyNames = ["Apple", "Apricot", "Banana", "Bilberry",
        "Blackberry", "Blackcurrant", "Blueberry", "Boysenberry",
        "Cantaloupe", "Currant", "Cherry", "Cherimoya", "Cloudberry",
        "Coconut", "Cranberry", "Damson", "Date", "Dragonfruit",
        "Durian", "Elderberry", "Feijoa", "Fig",  "Gooseberry",
        "Grape", "Raisin", "Grapefruit", "Guava",  "Huckleberry",
        "Honeydew", "Jackfruit", "Jambul", "Jujube",
        "Kiwi", "Kumquat", "Lemon", "Lime", "Loquat", "Lychee",
        "Mango", "Melon", "Watermelon", "Mulberry",
        "Nectarine", "Olive", "Orange", "Mandarine", "Blood",
        "Tangerine", "Papaya", "Passionfruit", "Peach", "Pear", "Persimmon"];

    if (![].includes) {
        Array.prototype.includes = function(searchElement /*, fromIndex*/ ) {
            var O = Object(this);
            var len = parseInt(O.length) || 0;
            if (len === 0) {
                return false;
            }
            var n = parseInt(arguments[1]) || 0;
            var k;
            if (n >= 0) {
                k = n;
            } else {
                k = len + n;
                if (k < 0) {k = 0;}
            }
            var currentElement;
            while (k < len) {
                currentElement = O[k];
                if (searchElement === currentElement ||
                    (searchElement !== searchElement && currentElement !== currentElement)) {
                    return true;
                }
                k++;
            }
            return false;
        };
    }

    var randomString = function () {
        return lobbyNames[Math.floor(Math.random()*lobbyNames.length)]
    };

    this.randomLobbyId = function (ids) {
        ids = ids || [];
        var id = randomString();
        while (ids.includes(id)) {
            id = randomString();
        }
        return id;
    };


}

global.Helper = Helper;
