## How to create project?
> npm init
> enter -> enter
> to: entry point: (index.js) server.js

## 2. How to run ?
>npm start

## 3. How to use swagger?
> npm start
> http://localhost:3000/docs (change port: 3000 to any value you like)



## Study API?
### 1.Response callback
> response =>{
    success : boolean,
    message: string,
    data: T  - trả về data
    details: {
        field:string, 
        errorMessage:string
    }
}

1.success: True khi xử thành công, False khi xử lý không thành công
2. message: Lý do cho success = false
3. details: chỉ dành cho validate input từ request
4. field: input field empty or failed
5. errorMessage: message for field



