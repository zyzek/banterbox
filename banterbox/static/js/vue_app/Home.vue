<template>
    <div>
        <h1>Yolo swaggins</h1>

        <p>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ab amet asperiores, consequatur debitis earum
            eligendi
            et expedita inventore magni minus mollitia necessitatibus nihil nisi odio placeat recusandae totam unde ut.
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ad autem ducimus molestiae placeat veniam! Aliquam
            architecto, dicta dignissimos eius et facilis illum ipsa nobis provident quo recusandae reiciendis ullam
            vitae.
        </p>
    </div>
</template>

<script>
    export default {
        route: {
            activate: function () {
                console.log('WELCOME TO THE GRID.')
            },
            deactivate: function () {
                console.log('NOW LEAVING THE GRID.')
            }
        }
    }
</script>