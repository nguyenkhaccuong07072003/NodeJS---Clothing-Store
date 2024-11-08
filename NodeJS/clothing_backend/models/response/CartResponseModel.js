// Định nghĩa và export từng class riêng lẻ

class CartResponseModel {
    constructor(user = null, cartId = null, listItem = null) {
        this.user_id = user;
        this.cart_id = cartId;
        this.list_item = listItem
    }
}

class CartItemResponseModel {
    constructor(id = null, productId = null, quantity = null, color = null, size = null, image = null, name = null, price = null) {
        this.id = id;
        this.product_id = productId;
        this.quantity = quantity;
        this.color = color;
        this.size = size;
        this.image = image;
        this.name = name;
        this.price = price;
    }
}

export default {CartResponseModel, CartItemResponseModel}
