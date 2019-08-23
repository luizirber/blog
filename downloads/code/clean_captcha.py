def captcha_to_greyscale(captcha):
    if captcha.mode == 'L':
        return captcha
    captcha = captcha.convert('L', (.4, .4, .4, 0))
    return captcha

def light_pixels_to_white_pixels(pixels, w, h):
    for x in xrange(w):
        for y in xrange(h):
            if pixels[x, y] > 50:
                pixels[x, y] = 255
    return pixels

def clean_captcha(img):
    img2 = captcha_to_greyscale(img)

    w, h = img2.size
    light_pixels_to_white_pixels(img2.load(), w, h)

    return img2
