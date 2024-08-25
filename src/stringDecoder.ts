const lookup1 = {
    "00" : "A",
    "01" : "B",
    "02" : "C",
    "03" : "D",
    "04" : "E",
    "05" : "F",
    "06" : "G",
    "07" : "H",
    "08" : "I",
    "09" : "J",
    "10" : "K",
    "11" : "L",
    "12" : "M",
    "13" : "N",
    "14" : "O",
    "15" : "P",
    "16" : "Q",
    "17" : "R",
    "18" : "S",
    "19" : "T",
    "20" : "U",
    "21" : "V",
    "22" : "W",
    "23" : "X",
    "24" : "Y",
    "25" : "Z",
    "26" : "g",
    "27" : "h",
    "28" : "i",
    "29" : "j",
    "30" : "k",
    "31" : "l",
    "32" : "m",
    "33" : "n",
    "34" : "o",
    "35" : "p",
    "36" : "q",
    "37" : "r",
    "38" : "s",
    "39" : "t",
    "40" : "u",
    "41" : "v",
    "42" : "w",
    "43" : "x",
    "44" : "y",
    "45" : "z",
}

export function shorten(data: string) : string {
    let result = data;
    for (let key in lookup1) {
        result = result.replace(key, lookup1[key]);
    }

    return result;
}

export function expand(data: string) : string {
    let result = data;    
    for (let key in lookup1) {
        result = result.replace(lookup1[key], key);
    }

    return result;
}