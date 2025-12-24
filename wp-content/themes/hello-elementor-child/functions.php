<?php
/**
 * Theme functions and definitions
 */

function hello_elementor_child_enqueue_scripts() {
	wp_enqueue_style( 'hello-elementor-parent-style', get_template_directory_uri() . '/style.css' );
}
add_action( 'wp_enqueue_scripts', 'hello_elementor_child_enqueue_scripts' );
