
class TestsHelper {

    makeId(count) {

      if (typeof count === 'undefined') count = Math.floor(Math.random()*100 + 30)

      var text = "";
      var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

      for (var i = 0; i < count; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

      return text;
    }

    makeIds(count, wordCount, randomLengths){

        if (typeof count === 'undefined') count = Math.floor(Math.random()*100 + 30)
        if (typeof randomLengths === 'undefined') randomLengths = false;

        let result = [];
        for (let i=0; i<count; i++) {

            let found = true;
            let word = this.makeId( randomLengths ? Math.floor( Math.random()*wordCount+1 ) : wordCount);

            //avoid identically words
            while (found){

                found = false;
                for (let j=0; j<result.length; j++)
                    if (result[j] === word) {
                        found = true;
                        word = this.makeId( randomLengths ? Math.floor( Math.random()*wordCount+1 ) : wordCount);
                        break;
                    }

            }
            result.push(word);
        }

        return result;

    }

    makeRandomNumber(biggestNumber){

        if (typeof biggestNumber === 'undefined') biggestNumber = 100000;

        return Math.random()*biggestNumber +  300;
    }

    makeSetIdAndNumber(count, floor, biggestNumber){

        if (typeof count === 'undefined') count = 10000;

        let list = this.makeIds(count);

        for (let i=0; i<list.length; i++) {
            let number = this.makeRandomNumber(biggestNumber);

            if (floor) number = Math.floor(number);

            list[i] = {text: list[i], value: number }
        }

        return list;

    }

}


export default new TestsHelper()