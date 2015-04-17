/**
 * Created by zchen on 17/4/15.
 */
function musicPlayer() {
    var isPlaying = false;
    var music = new Audio('./music/bgm.mp3');
    var haste = new Audio('./music/haste.mp3');
    var regen = new Audio('./music/regen.mp3');

    this.playHaste = function (){
       haste.play();
    };

    this.playRegen = function (){
        regen.play();
    };

    this.play = function () {
        $(window).on("blur focus", function (e) {
            var prevType = $(this).data("prevType");

            if (prevType != e.type) {   //  reduce double fire issues
                switch (e.type) {
                    case "blur":
                        if (isPlaying === true) {
                            music.pause();
                            isPlaying = false;
                        }
                        break;
                    case "focus":
                        if (isPlaying === false) {
                            music.play();
                            isPlaying = true;
                        }
                        break;
                }
            }
            $(this).data("prevType", e.type);
        });
        music.addEventListener('ended', function () {
            this.currentTime = 0;
            this.play();
            isPlaying = true;
        }, false);
        music.play();
        isPlaying = true;
    }
}
