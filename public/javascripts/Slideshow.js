/*!
 * Ublue jQuery Slideshow
 *
 * Copyright (c) 2011, 梦幻神化 
 * http://www.bluesdream.com
 *
 * Date: 2011.10.26
 *
 * 请保留此信息，如果您有修改或意见可通过网站给我留言，也可以通过邮件形式联系本人。
 * Mail: hello@bluesdream.com
 */
$(function() {
    var page = 0;
    var $arrow = $(".prev,.next");
    var $focusArea = $(".slideshow-area li");
    var $focusBulletsUl = $(".slideshow-bullets ul");
    var $len = $focusArea.length - 1;

    function autoClick() {
        $(".next").click()
    }

    var xxx = function() {

    };
    var $autoScroll = setInterval(autoClick, 5000);
    $arrow.hide();
    $(".slideshow").hover(function() {
                $arrow.show();
                clearInterval($autoScroll)
            },
            function() {
                $arrow.hide();
                $autoScroll = setInterval(autoClick, 5000)
            });
    $focusArea.eq(0).show().siblings().hide();
    $focusArea.each(function(i) {
        $(this).css("z-index", -(i - $len));
        $focusBulletsUl.append("<li>" + (i + 1) + "</li>");
        $(".slideshow-bullets li").eq(0).addClass("current")
    });
    var $focusBullets = $(".slideshow-bullets li");
    $(".next").click(function() {
        if (!$focusArea.is(":animated")) {
            if (page == $len) {
                $focusArea.eq(0).fadeIn('slow').siblings().fadeOut('slow');
                page = 0
            } else {
                $focusArea.eq(page).fadeOut('slow').next().fadeIn('slow');
                page++
            }
        }
        $focusBullets.eq(page).addClass("current").siblings().removeClass("current");
    });
    $(".prev").click(function() {
        if (!$focusArea.is(":animated")) {
            if (page == 0) {
                $focusArea.eq($len).fadeIn('slow').siblings().fadeOut('slow');
                page = $len
            } else {
                $focusArea.eq(page - 1).fadeIn('slow');
                page--
            }
        }
        $focusBullets.eq(page).addClass("current").siblings().removeClass("current")
    });
    $focusBullets.each(function(e) {
        $(this).click(function() {
            $focusBullets.eq(e).addClass("current").siblings().removeClass("current");
            page = e;
            if (page == 0) {
                $focusArea.eq(0).fadeIn()
            } else {
                $focusArea.eq(page).fadeIn('slow').siblings().fadeOut('slow')
            }
        })
    })
});