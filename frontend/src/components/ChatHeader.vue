<template>
    <header>
        <div class="tabWrapper">
            <div class="tab active">Chat</div>
        </div>
    </header>
</template>

<style scoped scss>
header {
    padding: 1rem;
    
    .tabWrapper {
        display: flex;
        border-bottom: 1px solid var(--colorLightGrey);
    }

    .tab {
        padding: 0 0 1rem;
        border-bottom: 2px solid transparent;
        margin-bottom: -1px;

        &.active {
            color: var(--colorBlue);
            border-color: var(--colorBlue);
            font-weight: bold;
        }
    }
}
</style>