(function (env) {
    "use strict";
    env.ddg_spice_timer = function(api_result) {
        Spice.add({
            id: "timer",
            name: "Timer",
            data: {},
            meta: {
                sourceName: "Timer",
                itemType: "timer"
            },
            templates: {
                detail: Spice.timer.timer,
                wrap_detail: 'base_detail'
            }
        });

        //add zeros to the end of the number
        function padZeros(n, len){
            var s = n.toString();
            while (s.length < len){
                s = '0' + s;
            }
            return s;
        }

        var time_left, last_update, update_int,
            started = false,
            $minute_input = $('#minute_input'),
            $second_input = $('#second_input'),
            $timer = $('#timer'),
            $reset_btn = $('#reset_btn'),
            $done_modal = $('#done_modal'),
            soundUrl = DDG.get_asset_path('timer', 'alarm.mp3');

        //go from a time in ms to human-readable
        function formatTime(t){
            t = Math.ceil(t/1000);
            var hours = Math.floor(t / (60*60));
            t = t % (60*60);
            var mins = Math.floor(t / 60);
            t = t % 60;
            var secs = Math.floor(t);
            if (hours > 0) return padZeros(hours, 2) + ":" + padZeros(mins, 2) + ":" + padZeros(secs, 2);
            return padZeros(mins, 2) + ":" + padZeros(secs, 2);
        }

        //play the alarm sound
        function playLoopingSound(){
            DDG.require('audio', function(player){
                function loop(){
                    player.play('alarm-sound', soundUrl, {autoPlay: true, onfinish: loop}); //play the sound
                }
                loop();
                $('#done_ok_btn').click(function(){player.stop('alarm-sound')}); //stop it when the modal is dismissed
            });
        }

        //called every tenth of a second (for accuracy purposes)
        //pop up the modal and play the sound if done
        function updateTimer(){
            time_left -= new Date().getTime() - last_update;
            if (time_left <= 0){
                clearInterval(update_int);
                $timer.html('00:00');
                $done_modal.show();
                playLoopingSound();
            } else {
                $timer.html(formatTime(time_left));
                last_update = new Date().getTime();
            }
        }

        //parse the input if the timer was just set and start it
        $('.btn-wrapper').on('click', '.timer__btn.timer__start', function(e){
            if (!started){
                var start_mins = parseInt($minute_input.val()) || 0;
                var start_secs = parseInt($second_input.val()) || 0;

                $minute_input.val('');
                $second_input.val('');

                //invalid input
                if (!start_secs && !start_mins) {
                    return;
                }
                if (start_mins > 999) {
                    start_mins = 999;
                    start_secs = 59;
                }
                if (start_secs > 59) start_secs = 59;
                started = true;
                time_left = start_mins * (60*1000) + start_secs*1000;
            }

            last_update = new Date().getTime();
            updateTimer();
            update_int = setInterval(updateTimer, 100);

            $('#timer_input').addClass('timer__hidden');
            $('#timer_display').removeClass('timer__hidden');
            $reset_btn.prop('disabled', false);

            $(this).removeClass('timer__start').addClass('timer__pause').html('PAUSE');
        });

        //pause the timer
        $('.btn-wrapper').on('click', '.timer__btn.timer__pause', function(){
            clearInterval(update_int);
            $(this).removeClass('timer__pause').addClass('timer__start').html('START');
        });

        function resetTimer(){
            $(this).prop('disabled', true);
            $('#timer_input').removeClass('timer__hidden');
            $('#timer_display').addClass('timer__hidden');
            clearInterval(update_int);
            started = false;
            $('.timer__btn.timer__pause').removeClass('timer__pause').addClass('timer__start').html('START');
            $reset_btn.prop('disabled', true);
        }

        //reset everything
        $reset_btn.click(resetTimer);

        //dismiss the modal and reset when "OK" is pressed
        $('#done_ok_btn').click(function(){
            $done_modal.hide();
            resetTimer();
        })

        //make sure the bang dropdown doesn't trigger
        $('.timer__time-input').keydown(function(event){
            event.stopPropagation();
        });

        //hide the source link
        if ($('#spice_timer').length){
            $('#zero_click_more_at_wrap').hide();

            $('#zero_click_wrapper2 #zero_click_abstract').attr('style',
                'padding: 0 !important; margin: 4px 0 0 0 !important');
        }

        //called when input is inserted, forcing numeric input
        function numericOnly(){
            this.value = this.value.replace(/\D/g, '');
        }

        //reject typing any keys that aren't numbers
        function typeNumericOnly(e){
            if (e.shiftKey === true){
                return (e.which == 9);
            }
            return !(e.which > 57 || e.which == 32) || (e.which >= 96 && e.which <= 105); //numpad
        }

        $('#minute_input').keydown(typeNumericOnly).change(numericOnly).click(numericOnly);
        $('#second_input').keydown(typeNumericOnly).change(numericOnly).click(numericOnly);
    }
}(this));