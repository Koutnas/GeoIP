cmake_minimum_required(VERSION 3.14)
project(GeoTrafficEngine CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# Automatically fetch and build the MaxMind DB library from source
include(FetchContent)
FetchContent_Declare(
    libmaxminddb
    GIT_REPOSITORY https://github.com/maxmind/libmaxminddb.git
    GIT_TAG        1.7.1
)
FetchContent_MakeAvailable(libmaxminddb)

set(LIBTINS_BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)
set(LIBTINS_BUILD_TESTS OFF CACHE BOOL "" FORCE)
set(LIBTINS_ENABLE_CXX11 ON CACHE BOOL "" FORCE)

FetchContent_Declare(
    tins
    GIT_REPOSITORY https://github.com/mfontanini/libtins.git
    GIT_TAG        v4.6
)
FetchContent_MakeAvailable(tins)

add_executable(engine 
    src/main.cpp 
    src/GeoResolver.cpp 
    src/UdpSender.cpp
    src/UdpTracert.cpp
    src/ThreadPool.cpp
    src/TracertListener.cpp
    src/DnsResolver.cpp
    src/GeneralListener.cpp
)

# Link the fetched MaxMind library
target_link_libraries(engine PRIVATE maxminddb tins)
target_include_directories(engine PRIVATE 
    src 
    ${CMAKE_SOURCE_DIR}/include 
    ${tins_SOURCE_DIR}/include)


add_custom_command(TARGET engine POST_BUILD
    COMMAND sudo setcap cap_net_raw,cap_net_admin=eip $<TARGET_FILE:engine>
    COMMENT "Elevating binary network capabilities..."
)