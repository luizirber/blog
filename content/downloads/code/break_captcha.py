from commands import getoutput
from StringIO import StringIO

from PIL import Image
import mechanize


def captcha_to_greyscale(captcha):
    if captcha.mode == 'L':
        return captcha
    captcha = captcha.convert('L', (.4, .4, .4, 0))
    return captcha


def light_pixels_to_white_pixels(pixels):
    w, h = pixels.size
    for x in xrange(w):
        for y in xrange(h):
            if pixels[x, y] > 50:
                pixels[x, y] = 255
    return pixels


def clean_captcha(img):
    img2 = captcha_to_greyscale(img)

    light_pixels_to_white_pixels(img2.load())

    return img2


if __name__ == '__main__':
    br = mechanize.Browser()

    for i in xrange(100):
        print 'voto', i

        page = br.open('http://brandili.com.br/faclube/captcha/captcha.php')
        img_str = StringIO(page.read())

        fp = open('original.tif', 'wb')
        img = Image.open(img_str)
        img.save(fp, format='tiff')

        output = clean_captcha(img)

        fp = open('tmp.tif', 'wb')
        output.save(fp, format='tiff')
        fp.close()

        getoutput('tesseract tmp.tif output -l brand')
        fp = open('output.txt')
        captcha = fp.read()[:6]
        fp.close()

        cadId = 28477

        vote_page = '*****/voto_v.php?votoStatus=1&cadastroId=%d&captcha=%s' % (
            cadId, captcha)

        br.open(vote_page)
