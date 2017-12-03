
class TestsHelper {

    makeId(count) {

      if (typeof count === 'undefined') count = Math.floor(Math.random()*100 + 30)

      var text = "";
      var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

      for (var i = 0; i < count; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

      return text;
    }

    makeIds(count, wordCount){

        if (typeof count === 'undefined') count = Math.floor(Math.random()*100 + 30)

        let result = [];
        for (let i=0; i<count; i++)
            result.push( this.makeId(wordCount) );

        return result;

    }


}


export default new TestsHelper()