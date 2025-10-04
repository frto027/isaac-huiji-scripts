import cv2
from pathlib import Path
import numpy as np

ACHIEVEMENT_COUNT = 641

W=64
H=64

IMG_PER_LINE = 20

LINE_COUNT = (ACHIEVEMENT_COUNT+IMG_PER_LINE) // IMG_PER_LINE

temp = Path(__file__).parent / 'temp'

total = np.zeros((H*LINE_COUNT,W*IMG_PER_LINE, 3), dtype=np.uint8)

for i in range(ACHIEVEMENT_COUNT):
    img = cv2.imread(str(temp/f"{i+1}.jpg"),cv2.IMREAD_UNCHANGED)
    assert img.shape[0] == W and img.shape[1] == H and img.shape[2] == 3
    
    x = i % IMG_PER_LINE
    y = i // IMG_PER_LINE

    total[y*W:(y+1)*W, x*H:(x+1)*H,:] = img

# cv2.imshow("show", total)
cv2.imwrite("result.png", total,[cv2.IMWRITE_PNG_COMPRESSION,9])
# cv2.waitKey()