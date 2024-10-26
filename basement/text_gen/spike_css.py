def pos(x):
    assert(x >= 0 and x < 5)
    return f'background-position-y:{(4-x)*-32}px;'

def spike_pos(x):
    ret = ""
    spikes = [
        0,1,2,3,4,
        4,4,4,4,4,
        4,4,4,4,4,
        4,4,4,4,4,
        4,4,4,4,4,
        4,3,2,1,0,
        0,0,0,0,0,
        0,0,0,0,0,
        0,0,0,0,0,
        0,0,0,0,0]
    # 省流，省掉50%
    last_pos = ""
    
    for i in range(len(spikes)):
        this_pos = pos(spikes[(len(spikes) + i-x*5)%len(spikes)])
        if this_pos != last_pos:
            last_pos = this_pos
            ret += "%.2f" % (i*100/len(spikes))
            ret += "%{"
            ret += this_pos
            ret += "}\n"
    return ret

def spike_pos_neg(x):
    ret = ""
    spikes = [
        4,3,2,1,0,
        0,0,0,0,0,
        0,0,0,0,0,
        0,0,0,0,0,
        0,1,2,3,4
    ]
    for i in range(25):
        ret += "%.2f" % (i*100/24)
        ret += "%{"
        ret += pos(spikes[(len(spikes) + i-x*5)%len(spikes)])
        ret += "}\n"
    return ret

css = ""

for i in range(10):
    css += "@keyframes rooms_spike_" + str(i+1) + "{\n"
    css += spike_pos(i)
    css += "}\n"

# for i in range(5):
#     css += "@keyframes rooms_spike_" + str(i+6) + "{\n"
#     css += spike_pos_neg(i)
#     css += "}\n"

for i in range(10):
    css += ".rooms_spike_" + str(i+1) + "{"
    css += "animation-name:rooms_spike_" + str(i+1) + ";animation-duration:%.2fs;" % (50 * 5 * 1 / 60)
    css += "}\n"

print(css)