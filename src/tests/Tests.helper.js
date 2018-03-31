class TestsHelper {

    makeId(count, randomLengths, textPossible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789") {

        if ( count === undefined) count = Math.floor(Math.random()*100 + 30 );

        if (randomLengths === true) randomLengths = Math.floor( Math.random() * count );

        if (randomLengths)
            count = randomLengths + Math.floor( Math.random() * ( count + randomLengths) );

        let text = "";
        let possible = textPossible;

        for (let i = 0; i < count; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }

    makeIdHex(count, randomLengths){
        return this.makeId(count, randomLengths, "ABCDEF01234567890")
    }

    makeDigitId(count, isNonDecimal, negative=false) {

        if ( count === undefined) count = Math.floor(Math.random()*100 + 30 );

        let text = "";
        let digits = "0123456789";

        let i = 0;
        if (isNonDecimal === true) {
            text += digits.charAt(1 + Math.floor(Math.random() * 9));
            i++;
        }

        for (; i < count; i++)
            text += digits.charAt(Math.floor(Math.random() * 10));

        if (negative)
            if (Math.floor(Math.random()*2) === 0)
                negative = false;

        if (negative)
            text = '-'+text;

        return text;
    }

    makeIds(count, wordCount, randomLengths){

        if ( count === undefined) count = Math.floor(Math.random()*100 + 30)
        if ( randomLengths === undefined) randomLengths = false;

        let result = [];
        for (let i=0; i<count; i++) {

            let word = this.makeId( wordCount, randomLengths);
            let found = true;

            //avoid identically words
            while (found){

                found = false;
                for (let j=0; j<result.length; j++)
                    if (result[j] === word) {
                        found = true;
                        word = this.makeId( wordCount, randomLengths);
                        break;
                    }

            }
            result.push(word);
        }

        return result;

    }

    makeRandomNumber(biggestNumber){

        if ( biggestNumber === undefined) biggestNumber = 100000;

        return Math.random()*biggestNumber +  300;
    }

    makeRandomNumber(noDecimalDigits=10, decimalDigits=10, negative=false){

        let nonDecimalPart = this.makeDigitId(noDecimalDigits, true, negative);

        if(decimalDigits > 0) {
            let decimalPart = this.makeDigitId(decimalDigits, false);
            return Number(nonDecimalPart + "." + decimalPart);
        } else {
            return Number(noDecimalDigits);
        }
    }

    makeRandomNumbersArray(count, isDecimal=false, negative=false){

        if ( count === undefined) count = 10;

        let result = [];
        for (let i = 0; i < count; ++i) {
            if (isDecimal === true)
                result[i] = this.makeRandomNumber(Math.floor(Math.random()*10), Math.floor(Math.random()*10), negative);
            else
                result[i] = this.makeRandomNumber(Math.floor(Math.random()*10), 0, negative);
        }

        return result;
    }

    makeSetIdAndNumber(count, floor, biggestNumber, wordCount, randomLengths){

        let list = this.makeIds(count, wordCount, randomLengths);

        for (let i=0; i<list.length; i++) {
            let number = this.makeRandomNumber(biggestNumber);

            if (floor) number = Math.floor(number);

            list[i] = {text: list[i], value: number }
        }

        return list;
    }

    makeSetVariableIdAndNumber(count, floor, biggestNumber, wordCount){
        return this.makeSetIdAndNumber(count, floor, biggestNumber, wordCount, true);
    }
	
	backPermutations(k, n, radixTestingArray, used, ind, result) {
		if(k === n) {
			let tmp = new Array(n);
			for(let i = 0; i < n; ++i) {
				tmp[i] = radixTestingArray[ind[i]];
			}
			result.push(tmp);
			return;
		}
		for(let i = 0; i < n; ++i) {
			if(used[i] === 0) {
				used[i] = 1;
				ind[k] = i;
				this.backPermutations(k + 1, n, radixTestingArray, used, ind, result)
				used[i] = 0;
			}
		}
	}
	
	makePermutations(radixTestingArray) {
		let used = new Array(radixTestingArray.length);
		for(let i = 0; i < used.length; ++i)
			used[i] = 0;
		let result = [];
		this.backPermutations(0, used.length, radixTestingArray, used, new Array(used.length), result);
		return result;
	}
    
    backCartesianProduct(k, maxLength, product, radixTestingArray, result) {
        let tmp = "";
        for(let i = 0; i < k; ++i) {
            tmp += product[i];
        }
        if(tmp !== "")
            result.push(tmp);
        if(k === maxLength)
            return;
        for(let i = 0; i < maxLength; ++i) {
            product[k] = radixTestingArray[i];
            this.backCartesianProduct(k + 1, maxLength, product, radixTestingArray, result);
        }
    }

    makeCartesianProduct(radixTestingArray, maxLength) {
        let result = [];
        let product = [];
        this.backCartesianProduct(0, maxLength, product, radixTestingArray, result);
        return result;
    }

}


export default new TestsHelper()