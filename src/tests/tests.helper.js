
export default class{

    static makeid(count) {

      if (typeof count === 'undefined') count = Math.floor(Math.random()*100)

      var text = "";
      var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

      for (var i = 0; i < count; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

      return text;
    }


}
